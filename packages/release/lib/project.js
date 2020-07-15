import { promisify } from 'util';
import { join } from 'path';

import chalk from 'chalk';
import semver from 'semver';
import lockVerify from 'lock-verify';
import gitState from '@nti/git-state';

import { listProjects, isProject } from './list.js';
import { exec } from './exec.js';
import { write, readJSON } from './utils.js';

process.env.__NTI_RELEASING = !process.argv.includes('--allow-workspace');
const skipChecks = process.argv.includes('--skip-checks');
const DATE = new Date().toString();

const usesLock = async (dir) => (await exec(dir, 'npm config get package-lock')) === 'true';
const gitStatus = promisify(gitState.check);


export async function getRepositories (dir = process.cwd()) {
	const projects = (await isProject(dir)('.')) ? [ dir ] : await listProjects(dir);
	return Promise.all(projects.map(checkStatus));
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
			shortRepo: repo.split('/')[1],
		};
	}

	const {branch, dirty, behind, remoteBranch = null} = await gitStatus(dir);

	if (!dirty && behind) {
		await exec(dir, 'git pull -r');
	}
	const pkg = await readJSON(join(dir, 'package.json'));
	const [command] = pkg.scripts?.test?.split?.(' ') ?? [];

	return {
		dir,
		behind,
		branch,
		dirty,
		command,
		pkg,
		...await resolveRemote(remoteBranch),
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
	const tasks = skipChecks ? [] : ['check', 'test'];
	const locked = await usesLock();

	if (await checkLockfile(dir) === false) {
		return false;
	}

	if (branch === 'master' && locked && !process.argv.includes('--skip-lock-refresh')) {
		tasks.unshift('update-lock');
	}

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
	if (!await usesLock()) {return;}

	const {warnings = [], errors = [], status} = await lockVerify(dir);

	warnings.forEach(e => write(chalk.yellow('%s %s'), chalk.underline('Warning:'), e));
	if (warnings.length > 0) {
		write('');
	}

	if (!status) {
		errors.forEach(e => write(chalk.red('%s %s'), chalk.underline('Error:'), e));
		write('');
		write(chalk.red(chalk.bold('Check that package-lock.json is in sync with package.json')));
		write('');
		return false;
	}
}


export async function performRelease (tasks, {dir, branch, repo, command, pkg, url}, major) {
	const call = (x, args = []) => exec(dir, [x, ...args].join(' '));
	write(chalk.cyan('Working on branch: ' + chalk.underline.magenta(branch)));

	for (let task of tasks) {
		write(chalk.cyan('\nRunning: Task: ' + chalk.underline.magenta(task)));
		await call(command, [task]);
	}

	const inc = branch === 'master' ? (major ? 'major' : 'minor') : 'patch';
	const version = semver.inc(pkg.version, inc);
	const newTag = `v${version}`;
	const nextVersion = semver.inc(version, 'minor') + '-alpha';
	const lock = await usesLock();
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
	await call('git', ['tag', newTag, '-m', `Cut on ${DATE}`]);


	if (branch === 'master') {
		write(chalk.cyan(`\nSetting up next release version: ${chalk.underline.magenta(nextVersion)}...`));
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
