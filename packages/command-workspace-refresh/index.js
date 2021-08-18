#!/usr/bin/env node
import * as childProcess from 'child_process';
import { promises as fs } from 'fs';
import { dirname, join, resolve } from 'path';
import { promisify } from 'util';
import gitState from '@nti/git-state';
import glob from 'glob';
import ora from 'ora';

const gitStatus = promisify(gitState.check);

const find = promisify(glob);
// const skipClean = !~process.argv.findIndex(x => /skip-clean/i);

async function clean() {
	const tmpDir = join(process.cwd(), '.trash');

	const candidates = await find('**/node_modules');
	const moduleDirs = candidates.filter(
		(x, i, a) => !a.slice(0, i).find(y => x.startsWith(y))
	);
	await Promise.all(
		moduleDirs.map(async x => {
			await fs.mkdir(tmpDir, { recursive: true });
			const trash = await fs.mkdtemp(join(tmpDir, 'trash-'));
			await fs.rename(resolve(x), join(trash, 'node_modules'));
		})
	);

	// Don't wait for this, let it run in the background
	fs.rm(tmpDir, { force: true, recursive: true }).catch(er =>
		console.warn(
			'[warn] Could not remove ${trash}\n\tbecause: ',
			er.message
		)
	);
}

async function update() {
	const candidates = await find('**/.git');
	const repos = candidates
		.filter(
			(x, i, a) =>
				!x.includes('node_modules') &&
				!a.slice(0, i).find(y => x.startsWith(y))
		)
		.map(x => resolve(dirname(x)));

	await Promise.all(
		repos.map(async repo => {
			try {
				// unset hooks just incase something interrupts re-installing them
				const hookFile = join(repo, '.git/hooks/pre-commit');
				const hookConfig = 'git config --unset core.hooksPath';
				await Promise.all([
					exec(repo, hookConfig).catch(() => {}),
					fs.unlink(hookFile).catch(() => {}),
				]);

				// branch, remoteBranch, ahead, behind, dirty, untracked, stashes
				const status = await gitStatus(repo);
				let commits = [];
				if (status.remoteBranch) {
					commits = (
						await exec(
							repo,
							// https://git-scm.com/docs/git-log#Documentation/git-log.txt---cherry
							`git log --oneline --cherry ${status.remoteBranch}...${status.branch}`
						).catch(() => '')
					).split(/[\r\n]+/);
				}

				// See https://git-scm.com/docs/git-log#Documentation/git-log.txt---cherry
				// Equivalent but distinct commits will be marked with '= ' prefix. (meaning
				// the remote does not have the commit but is equivalent to another commit)
				const hasDuplicates = commits.some(line =>
					line.startsWith('= ')
				);

				// if a branch is in a rebased state, and has not force-pushed...it will
				// have duplicated commits. If we're in this state, do not pull.
				if (status.remoteBranch && !hasDuplicates) {
					await exec(repo, 'git pull --rebase --autostash');
				}
			} catch (er) {
				console.warn('[warn] %s:\n%s', repo, er);
				// if we threw an error, abort any rebase in progress.
				await exec(repo, 'git rebase --abort').catch(() => null);
			}
		})
	);
}

(async function main() {
	const spinner = ora('Locating workspace root...').start();
	try {
		await findRoot();

		spinner.info('Pulling & Cleaning...');
		await Promise.all([update(), clean()]);
		spinner.stop();
	} catch (e) {
		console.error('Could not fully clean node_modules: ', e.message);
		process.exit(1);
	}

	childProcess.execSync('npm install --no-audit --no-fund', {
		cwd: resolve('.'),
		env: {
			...process.env,
			NTI_WORKSPACE_REFRESH: true,
		},
		stdio: 'inherit',
	});
})();

export async function exec(cwd, command) {
	return new Promise((fulfill, reject) => {
		childProcess.exec(command, { cwd }, (err, stdout, stderr) => {
			if (err) {
				return reject(stderr.toString('utf8'));
				// return reject(err);
			}

			fulfill(stdout.toString('utf8').trim());
		});
	});
}

async function findRoot() {
	try {
		const content = await fs.readFile('./package.json');
		const pkg = JSON.parse(content);
		if (Array.isArray(pkg.workspaces)) {
			return;
		}
	} catch {
		/* move on */
	}

	const parent = resolve('..');
	if (parent === process.cwd()) {
		throw new Error('Could not find workspace root.');
	}

	process.chdir(parent);
	await findRoot();
}
