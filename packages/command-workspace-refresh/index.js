#!/usr/bin/env node
import events from 'events';
import * as childProcess from 'child_process';
import { promises as fs } from 'fs';
import { dirname, join, resolve } from 'path';
import { promisify } from 'util';
import gitState from '@nti/git-state';
import glob from 'glob';
import ora from 'ora';
import ms from 'ms';

events.defaultMaxListeners = 0;
const gitStatus = promisify(gitState.check);

const controller = new AbortController();

const find = promisify(glob);
const tmpDir = join(process.cwd(), '.trash');
const altered = [];
const startTime = Date.now();
let cleanup = null;
let exiting = false;
// const skipClean = !~process.argv.findIndex(x => /skip-clean/i);

async function exitHandler(error, code) {
	if (exiting) {
		return;
	}

	if (code) {
		process.exitCode = code;
	}

	exiting = true;
	controller.abort();
	try {
		await Promise.all([cleanup?.catch(e => null), ...altered.map(restore)]);
	} catch (e) {
		console.log(e);
	}

	// process.exit(code || 0);
}

async function sigUsr2() {
	console.log(
		'Restoring modified files. Install took: %ds',
		ms(Date.now() - startTime)
	);
	const list = altered.splice(0, altered.length);
	list.map(restore);
}

process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', sigUsr2);
process.on('uncaughtException', exitHandler);

async function clean() {
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

	cleanup = fs.rm(tmpDir, { force: true, recursive: true });
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

				await applyNpmWorkspaceTempFix(repo);
			} catch (er) {
				if (er) {
					console.warn('[warn] %s:\n%s', repo, er);
				}
				// if we threw an error, abort any rebase in progress.
				await exec(repo, 'git rebase --abort', { signal: null }).catch(
					() => null
				);
			}
		})
	);
}

(async function main() {
	const spinner = ora('Locating workspace root...').start();
	try {
		await findRoot();

		spinner.info('Pulling & Cleaning...');
		await Promise.all([clean(), update()]);
		spinner.stop();
	} catch (e) {
		spinner.stop();
		console.error('Could not fully clean node_modules: ', e.message);
		process.exit(1);
	}

	if (exiting || controller.signal.aborted) {
		return;
	}

	await spawn('npm', ['install', '--no-audit', '--no-fund']);
})();

async function spawn(command, args, opts) {
	return new Promise((fulfill, reject) => {
		try {
			const p = childProcess.spawn(command, args, {
				cwd: resolve('.'),
				env: {
					...process.env,
					NTI_WORKSPACE_REFRESH_PID: process.pid,
					NTI_WORKSPACE_REFRESH: true,
				},
				signal: controller.signal,
				stdio: 'inherit',
				...opts,
			});

			p.on('close', code => {
				if (code) {
					reject(code);
				} else {
					fulfill();
				}
			});
		} catch (e) {
			console.log(e);
			reject(e);
		}
	});
}

export async function exec(cwd, command) {
	return new Promise((fulfill, reject) => {
		childProcess.exec(
			command,
			{
				cwd,
				env: {
					...process.env,
					NTI_WORKSPACE_REFRESH_PID: process.pid,
					NTI_WORKSPACE_REFRESH: true,
				},
				signal: controller.signal,
			},
			(err, stdout, stderr) => {
				if (err) {
					return reject(stderr.toString('utf8'));
					// return reject(err);
				}

				fulfill(stdout.toString('utf8').trim());
			}
		);
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

async function restore(file) {
	try {
		await exec(dirname(file), `git checkout ${file}`);
	} catch (e) {
		console.warn(e);
	}
}

async function applyNpmWorkspaceTempFix(repo) {
	const pkg = join(repo, 'package.json');
	let json;
	try {
		json = JSON.parse(await fs.readFile(pkg));
	} catch (e) {
		if (e.code !== 'ENOENT') {
			console.warn(
				'[NPM Workspace Hack] WARN: Skipping %s because: %j',
				pkg,
				e.message
			);
		}
		return;
	}

	let mod = false;
	for (const section of [
		'dependencies',
		'devDependencies',
		'peerDependencies',
	]) {
		const sec = json[section] || {};
		for (const [key, value] of Object.entries(sec)) {
			if (value.startsWith('NextThought')) {
				mod = true;
				sec[key] = '*';
			}
		}
	}

	if (!mod) {
		return;
	}

	try {
		await fs.writeFile(pkg, JSON.stringify(json, null, '  ').trim());
		altered.push(pkg);
	} catch (e) {
		console.warn('[NPM Workspace Hack] WARN: ', pkg, e.message);
	}
}
