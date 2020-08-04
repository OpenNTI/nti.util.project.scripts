import { promisify } from 'util';
import { join } from 'path';
import { promises as fs } from 'fs';

import chalk from 'chalk';
import semver from 'semver';
import lockVerify from 'lock-verify';
import gitState from '@nti/git-state';

import { listProjects, isProject } from './list.js';
import { exec } from './exec.js';
import { arg, write, readJSON } from './utils.js';
import { updateLock } from './update-lock.js';

process.env.__NTI_RELEASING = !arg('--allow-workspace', 'repo:Allow workspace links in builds that support them');
// const SKIP_CHECKS = arg('--skip-checks', 'repo:Skip tests and linting');
const SKIP_LOCK_REFRESH = arg('--skip-lock-refresh', 'repo:Prevent regeneration of node_modules and lockfile');
const DRY_RUN = arg('--dry-run', 'repo:Print actions instead of executing them');
const DATE = new Date().toString();

const exists = async file => fs.stat(file).then(() => true, () => false);
const usesLock = async (dir) => (await exec(dir, 'npm config get package-lock')) === 'true';
const gitStatus = promisify(gitState.check);


export async function getRepositories (dir = process.cwd()) {
	const projects = (await isProject(dir)('.')) ? [ dir ] : await listProjects(dir);
	const repos = await Promise.all(projects.map(checkStatus));

	repos.sort((a, b) => {
		const {command: a1} = a;
		const {command: b1} = b;

		const c = a.repo.localeCompare(b.repo);

		if (a1 !== b1 ) {
			if (a1 === 'app-scripts') {
				return -1;
			}

			if (b1 === 'app-scripts') {
				return 1;
			}
		}

		return c;
	});

	return repos;
}


export async function checkStatus (dir) {
	// get the latest git state from remote
	await exec(dir, 'git fetch');

	async function resolveRemote (branch) {
		if (!branch) {return;}
		const [origin] = branch.split('/');
		const url = await exec (dir, `git remote get-url ${origin}`);
		const[, repo] = url.match(/github.com[:/](.+?)(?:\.git)?$/i) ?? [];
		return {
			url,
			repo,
			shortName: repo.split('/')[1],
		};
	}

	// branch, remoteBranch, ahead, behind, dirty, untracked, stashes
	const {remoteBranch:remote = null, ...status} = await gitStatus(dir);

	if (!status.dirty && status.behind) {
		await exec(dir, 'git pull -r');
		status.behind = 0;
	}

	const pkg = await readJSON(join(dir, 'package.json'));
	const [command] = pkg.scripts?.test?.split?.(' ') ?? [];

	return {
		dir,
		command: /^(.+)-scripts$/.test(command) ? command : void 0,
		pkg,
		...status,
		...await resolveRemote(remote),
		...await hasChanges(dir)
	};
}


async function hasChanges (dir) {
	const description = await exec(dir, 'git describe --always --long --first-parent --abbrev=40');
	let [sha, commits, tag] = description.split(/-g?/).reverse();

	commits = parseInt(commits, 10);
	if (isNaN(commits)) {
		commits = void 0;
	}

	const fileChanges = tag && await whatChanged(dir, tag);

	return {
		lastTag: tag,
		sha,
		commitsSinceTag: commits, //number since tag.
		fileChanges,
		metadataOnlyChanges: !fileChanges?.length || fileChanges?.every(x => !/^(src|lib)/.test(x) || /__test__/.test(x))
	};
}


async function whatChanged (dir, from, to = 'HEAD') {
	return (await exec(dir, `git diff --name-only ${from}..${to}`)).split('\n');
}


export async function preflightChecks ({dir, branch, dirty, pkg}, major) {
	const tasks = [];//SKIP_CHECKS ? [] : ['check', 'test'];

	if(!/^(master|(maint-\d+\.\d+))$/.test(branch)) {
		write('\n\n'
			+ chalk.red('You cannot release a version while on feature branch: ' + chalk.underline(branch)
			+ '.\nYou must be on ' + chalk.underline('master')) + ' or ' + chalk.underline('maint-n.m') + '\n\n');
		return false;
	}

	if (major && branch !== 'master') {
		write('\n\n'
			+ chalk.red('You cannot release a major version increment while on branch: ' + chalk.underline(branch)
			+ '.\nYou must be on ' + chalk.underline('master')) + '\n\n');
		return false;
	}

	if (dirty) {
		write('\n\n' + chalk.red(chalk.underline(dir) + ' has uncommitted changes.') + '\n\n');
		return false;
	}

	if (branch === 'master' && !/-alpha$/.test(pkg.version)) {
		write('\n\n' + chalk.red(chalk.underline(pkg.name + '@' + pkg.version) + ' should end in -alpha.') + '\n\n');
		return false;
	}

	if (branch !== 'master' && /-alpha$/.test(pkg.version)) {
		write('\n\n' + chalk.red('The branch and version are mismatched. Alpha tags should not be on maint branches.') + '\n\n');
		return false;
	}

	return tasks;
}


export async function checkLockfile (dir) {
	if (!await usesLock(dir)) {return;}

	const {warnings = [], errors = [], status} = await lockVerify(dir).catch(() => ({}));

	warnings.forEach(e => write(chalk.yellow('%s %s'), chalk.underline('Warning:'), e));
	if (warnings.length > 0) {
		write('');
	}

	if (!status) {
		errors.forEach(e => write(chalk.red('%s %s'), chalk.underline('Error:'), e));
		write('');
		write(chalk.red('in ' + chalk.bold(dir + ':')));
		write(chalk.red(chalk.bold('Check that package-lock.json is in sync with package.json')));
		write('');
		return false;
	}
}


export async function performRelease (tasks, {dir, branch, repo, command, pkg, url}, major) {
	const call = DRY_RUN
		? async (x, args = []) => write('[dry run] in', dir, [x, ...args].join(' '))
		: async (x, args = []) => exec(dir, [x, ...args].join(' '));

	write(chalk.cyan(chalk.underline(pkg.name) + ' Working on branch: ' + chalk.underline.magenta(branch)));
	// write(chalk.cyan('Working on branch: ' + chalk.underline.magenta(branch)));

	if (branch === 'master' && !SKIP_LOCK_REFRESH) {
		await updateLock(dir, DRY_RUN);
	}

	if (await checkLockfile(dir) === false) {
		return false;
	}

	for (let task of tasks) {
		if (!command) {
			continue;
		}

		write(chalk.cyan('\nRunning: Task: ' + chalk.underline.magenta(task)));
		await call(command, [task]);
	}

	const inc = branch === 'master' ? (major ? 'major' : 'minor') : 'patch';
	const version = semver.inc(pkg.version, inc);
	const newTag = `v${version}`;
	const nextVersion = semver.inc(version, 'minor') + '-alpha';
	const lock = await usesLock(dir);
	const packageFiles = [
		'package.json',
		lock && 'package-lock.json'
	].filter(Boolean);

	// npm --no-git-tag-version version $VERSION > /dev/null
	write(chalk.cyan(`\nSetting release version: ${chalk.underline.magenta(version)}...`));
	await call('npm', ['--no-git-tag-version', 'version', version], {stdio: null});

	write(chalk.cyan(`\nCommitting release version ${chalk.underline.magenta(version)}, tagging...`));
	// git add package.json package-lock.json
	await call('git', ['add', ...packageFiles]);
	// git commit -m "$VERSION" > /dev/null
	await call('git', ['commit', '-m', version]);
	// git tag "v$VERSION" -m "Cut on $DATE"
	await call('git', ['tag', newTag, '-m', `"Cut on ${DATE}"`]);


	if (branch === 'master') {
		write(chalk.cyan(`\nSetting up next release version: ${chalk.underline.magenta(nextVersion)}...`));
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
		await call('npm', ['--no-git-tag-version', 'version', nextVersion], {stdio: null});

		// git add package.json package-lock.json
		await call('git', ['add', ...packageFiles]);
		// git commit -m "$VERSION" > /dev/null
		await call('git', ['commit', '-m', nextVersion]);
	}

	write(chalk.cyan(`\n${chalk.underline('Pushing')} changes to remote...`));
	await call('git', ['push', 'origin', 'tag', newTag]);

	if (url) {
		await call('git', ['push']);
	}


	write('\n');
	write(chalk.magenta(`Done. (${repo})\n\n`));
}
