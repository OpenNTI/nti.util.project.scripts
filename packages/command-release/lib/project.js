import { promisify } from 'util';
import { join } from 'path';
import { promises as fs, existsSync } from 'fs';

import chalk from 'chalk';
import semver from 'semver';
import lockVerify from 'lock-verify';
import gitState from '@nti/git-state';
import { dispatchEvent } from '@nti/github-api';

import { listProjects, isProject } from './list.js';
import { exec } from './exec.js';
import { arg, write, readJSON } from './utils.js';
import { updateLock, usesLock } from './update-lock.js';

const CI = !!process.env.CI;
process.env.__NTI_RELEASING = true;
// const SKIP_CHECKS = arg('--skip-checks', 'repo:Skip tests and linting');
const SKIP_LOCK_REFRESH = arg(
	'--skip-lock-refresh',
	'repo:Prevent regeneration of node_modules and lockfile'
);
const DRY_RUN = arg(
	'--dry-run',
	'repo:Print actions instead of executing them'
);
const DATE = new Date().toString();

const exists = async file =>
	fs.stat(file).then(
		() => true,
		() => false
	);
const gitStatus = promisify(gitState.check);

export async function getRepositories(dir = process.cwd()) {
	const projects = (await isProject(dir)('.'))
		? [dir]
		: await listProjects(dir);
	const repos = await Promise.all(projects.map(checkStatus));

	repos.sort((a, b) => {
		const { willLock: a1 } = a;
		const { willLock: b1 } = b;

		const c = a.dir.localeCompare(b.dir);

		if (a1 !== b1) {
			return a1 ? -1 : b1 ? 1 : c;
		}

		return c;
	});

	return Promise.all(repos.map(resolveChanges));
}

function parseGitHubURL(url) {
	const [, repo] = url.match(/github.com[:/](.+?)(?:\.git)?$/i) ?? [];
	return {
		url,
		repo,
		shortName: repo.split('/')[1],
	};
}

async function resolveRemote(dir, branch) {
	if (!branch) {
		return;
	}
	const [origin] = branch.split('/');
	const url = await exec(dir, `git remote get-url ${origin}`);
	return parseGitHubURL(url);
}

export async function checkStatus(dir, _, repos) {
	// get the latest git state from remote
	await exec(dir, 'git fetch');

	// branch, remoteBranch, ahead, behind, dirty, untracked, stashes
	const [{ remoteBranch: remote = null, ...status }, willLock] =
		await Promise.all([gitStatus(dir), usesLock(dir)]);

	if (!status.dirty && status.behind) {
		await exec(dir, 'git pull -r');
		status.behind = 0;
	}

	const pkg = await readJSON(join(dir, 'package.json'));
	const [command] = pkg.scripts?.test?.split?.(' ') ?? [];
	// if (!/-alpha$/.test(pkg.version)) {
	// 	throw new Error(
	// 		`Invalid Package Version ("${pkg.version}", should be formatted: "X.Y.Z-alpha") in workspace: ${dir}`
	// 	);
	// }

	return {
		dir,
		relativeDir: dir.replace(process.cwd(), '.'),
		willLock,
		command: /^(.+)-scripts$/.test(command) ? command : void 0,
		pkg,
		...status,
		...(await resolveRemote(dir, remote)),
	};
}

async function resolveChanges(repo, _, repos) {
	return {
		...repo,
		...(await hasChanges(repo.dir, repos)),
	};
}

async function hasChanges(dir, knownRepos) {
	const description = await exec(
		dir,
		'git describe --always --long --first-parent --abbrev=40'
	);
	let [sha, commits, tag] = description.split(/-g?/).reverse();

	commits = parseInt(commits, 10);
	if (isNaN(commits)) {
		commits = void 0;
	}

	const commitsSinceTag = commits; //number since tag.
	const { fileChanges, metadataOnlyChanges } = await whatChanged(dir, tag);

	const needsResolving = (await usesLock(dir)) && tag && metadataOnlyChanges;
	const dependencyUpdates = needsResolving
		? await resolveDependencyUpdates(dir, tag, knownRepos)
		: false;

	return {
		lastTag: tag,
		sha,
		commitsSinceTag,
		fileChanges,
		metadataOnlyChanges,
		dependencyUpdates,
	};
}

async function whatChanged(dir, from, to = 'HEAD') {
	const fileChanges =
		dir &&
		from &&
		(await exec(dir, `git diff --name-only ${from}..${to}`)).split('\n');
	const metadataOnlyChanges =
		!fileChanges?.length ||
		fileChanges?.every(x => !/^(src|lib)/.test(x) || /__test__/.test(x));
	return {
		fileChanges,
		metadataOnlyChanges,
	};
}

async function resolveDependencyUpdates(dir, from, knownRepos) {
	let lock;
	try {
		lock = JSON.parse(
			await exec(dir, `git show "${from}":package-lock.json`, true)
		);
	} catch (e) {
		// console.error(e);
		return false;
	}

	async function getDefaultBranch(dir, retry = true) {
		try {
			return !dir
				? null // unknown
				: await exec(dir, 'git rev-parse --abbrev-ref origin/HEAD');
		} catch (e) {
			if (retry) {
				await exec(dir, 'git remote set-head origin --auto');
				return getDefaultBranch(dir, false);
			}
			throw e;
		}
	}

	const gitDeps = Object.values(lock.dependencies)
		.map(value => (value.version?.startsWith('git') ? value.version : null))
		.filter(Boolean);

	const data = await Promise.all(
		gitDeps.map(async entry => {
			const [url, hash] = entry.split('#');
			const { repo } = parseGitHubURL(url);

			const { dir, pkg } = knownRepos.find(x => x.repo === repo) || {};
			const defaultBranch = await getDefaultBranch(dir);

			const currentCommit = !dir
				? hash // default to known
				: await exec(dir, `git rev-parse ${defaultBranch}`);

			if (!dir) {
				console.warn(`Could not resolve ${repo} to a directory`);
			}

			return {
				dir,
				repo,
				packageName: pkg?.name,
				changed:
					hash !== currentCommit
						? await whatChanged(dir, hash, currentCommit)
						: false,
				hash,
				currentCommit,
				defaultBranch,
			};
		})
	);

	return data
		.filter(x => x.changed?.metadataOnlyChanges === false)
		.reduce((out, i) => (i ? [...(out || []), i] : out), false);
}

export async function preflightChecks({ dir, branch, dirty, pkg }, major) {
	const tasks = []; //SKIP_CHECKS ? [] : ['check', 'test'];

	if (!/^(master|(maint-\d+\.\d+))$/.test(branch)) {
		write(
			'\n\n' +
				chalk.red(
					'You cannot release a version while on feature branch: ' +
						chalk.underline(branch) +
						'.\nYou must be on ' +
						chalk.underline('master')
				) +
				' or ' +
				chalk.underline('maint-n.m') +
				'\n\n'
		);
		return false;
	}

	if (major && branch !== 'master') {
		write(
			'\n\n' +
				chalk.red(
					'You cannot release a major version increment while on branch: ' +
						chalk.underline(branch) +
						'.\nYou must be on ' +
						chalk.underline('master')
				) +
				'\n\n'
		);
		return false;
	}

	if (dirty) {
		write(
			'\n\n' +
				chalk.red(chalk.underline(dir) + ' has uncommitted changes.') +
				'\n\n'
		);
		return false;
	}

	if (branch === 'master' && !/-alpha$/.test(pkg.version)) {
		write(
			'\n\n' +
				chalk.red(
					chalk.underline(pkg.name + '@' + pkg.version) +
						' should end in -alpha.'
				) +
				'\n\n'
		);
		return false;
	}

	if (branch !== 'master' && /-alpha$/.test(pkg.version)) {
		write(
			'\n\n' +
				chalk.red(
					'The branch and version are mismatched. Alpha tags should not be on maint branches.'
				) +
				'\n\n'
		);
		return false;
	}

	return tasks;
}

export async function checkLockfile(dir) {
	if (!(await usesLock(dir))) {
		return;
	}

	const {
		warnings = [],
		errors = [],
		status,
	} = await lockVerify(dir).catch(() => ({}));

	warnings.forEach(e =>
		write(chalk.yellow('%s %s'), chalk.underline('Warning:'), e)
	);
	if (warnings.length > 0) {
		write('');
	}

	if (!status) {
		errors.forEach(e =>
			write(chalk.red('%s %s'), chalk.underline('Error:'), e)
		);
		write('');
		write(chalk.red('in ' + chalk.bold(dir + ':')));
		write(
			chalk.red(
				chalk.bold(
					'Check that package-lock.json is in sync with package.json'
				)
			)
		);
		write('');
		return false;
	}
}

function hasReleaseWorkflow(dir) {
	return existsSync(join(dir, '.github/workflows/create-release.yml'));
}

export async function performRelease(
	tasks,
	{ dir, branch, repo, command, pkg, url },
	major
) {
	const call = DRY_RUN
		? async (x, args = []) =>
				write('[dry run] in', dir, [x, ...args].join(' '))
		: async (x, args = []) => exec(dir, [x, ...args].join(' '));

	if (!CI && hasReleaseWorkflow(dir) && branch === 'master') {
		if (DRY_RUN) {
			write(
				`[dry run] Will dispatch release-next event to github actions: ${dir}`
			);
			return;
		}

		const { message } = await dispatchEvent(dir, 'release-next');
		write(message);
		return;
	}

	write(
		chalk.cyan(
			chalk.underline(pkg.name) +
				' Working on branch: ' +
				chalk.underline.magenta(branch)
		)
	);
	// write(chalk.cyan('Working on branch: ' + chalk.underline.magenta(branch)));

	if (branch === 'master' && !SKIP_LOCK_REFRESH) {
		await updateLock(dir, DRY_RUN);
	} else if ((await checkLockfile(dir)) === false) {
		return false;
	}

	for (let task of tasks) {
		if (!command) {
			continue;
		}

		write(chalk.cyan('\nRunning: Task: ' + chalk.underline.magenta(task)));
		await call(command, [task]);
	}

	const LastYear = new Date().getFullYear() - 1;
	if (branch === 'master' && semver.parse(pkg.version)?.major === LastYear) {
		major = true;
	}

	const inc = branch === 'master' ? (major ? 'major' : 'minor') : 'patch';
	const version = semver.inc(pkg.version, inc);
	const newTag = `v${version}`;
	const nextVersion = semver.inc(version, 'minor') + '-alpha';
	const lock = await usesLock(dir);
	const packageFiles = ['package.json', lock && 'package-lock.json'].filter(
		Boolean
	);

	// npm --no-git-tag-version version $VERSION > /dev/null
	write(
		chalk.cyan(
			`\nSetting release version: ${chalk.underline.magenta(version)}...`
		)
	);
	await call('npm', ['--no-git-tag-version', 'version', version], {
		stdio: null,
	});

	write(
		chalk.cyan(
			`\nCommitting release version ${chalk.underline.magenta(
				version
			)}, tagging...`
		)
	);
	// git add package.json package-lock.json
	await call('git', ['add', ...packageFiles, '-f']);
	// git commit -m "$VERSION" > /dev/null
	await call('git', ['commit', '-m', version]);
	// git tag "v$VERSION" -m "Cut on $DATE"
	await call('git', ['tag', newTag, '-m', `"Cut on ${DATE}"`]);

	if (branch === 'master') {
		write(
			chalk.cyan(
				`\nSetting up next release version: ${chalk.underline.magenta(
					nextVersion
				)}...`
			)
		);
		const lockfile = join(dir, 'package-lock.json');
		// unlock dependencies
		if (await exists(lockfile)) {
			if (DRY_RUN) {
				write('[dry run] in', dir, 'rm', lockfile);
			} else {
				await fs.unlink(lockfile);
			}
		}

		// npm --no-git-tag-version version $VERSION > /dev/null
		await call(
			'npm',
			['--no-git-tag-version', 'version', `"${nextVersion}"`],
			{ stdio: null }
		);

		// git add package.json package-lock.json
		await call('git', ['add', ...packageFiles, '-f']);
		// git commit -m "$VERSION" > /dev/null
		await call('git', ['commit', '-m', `"${nextVersion}"`]);
	}

	write(chalk.cyan(`\n${chalk.underline('Pushing')} changes to remote...`));
	await call('git', ['push', 'origin', 'tag', newTag]);

	if (url) {
		await call('git', ['push']);
	}

	write('\n');
	write(chalk.magenta(`Done. (${repo})\n\n`));
}
