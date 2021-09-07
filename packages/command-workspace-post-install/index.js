#!/usr/bin/env node
import events from 'events';
import * as childProcess from 'child_process';
import { promises as fs } from 'fs';
import { dirname, resolve } from 'path';
import glob from 'glob';
import ora from 'ora';

events.defaultMaxListeners = 0;
const controller = new AbortController();

if (!fs.rm) {
	console.warn(
		`

	Your version of nodejs is too old. Please use 14.14.0 or newer.

	`.replace(/\t/g, '')
	);
	process.exit(1);
}

const { NTI_BUILDOUT_PATH = null, NTI_SKIP_DOCKER = null } = process.env;

async function exitHandler(error, code) {
	if (code) {
		process.exitCode = code;
	}
	if (typeof error !== 'string') {
		console.error(error?.stack || error);
	}
	controller.abort();
}

// process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);
process.on('uncaughtException', exitHandler);
process.on('unhandledRejection', exitHandler);

export async function exec(cwd, command) {
	return new Promise((fulfill, reject) => {
		childProcess.exec(
			command,
			{ cwd, signal: controller.signal },
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

async function spawn(command, args, opts) {
	return new Promise((fulfill, reject) => {
		const p = childProcess.spawn(command, args, {
			shell: true,
			signal: controller.signal,
			stdio: 'inherit',
			...opts,
		});
		p.on('close', code => {
			if (code) {
				// code 0 = success, any other is failure
				reject(code);
			} else {
				fulfill();
			}
		});
	});
}

async function install(dir) {
	await exec(dir, 'npm install --no-progress --no-audit --silent').catch(
		e => {
			process.exitCode = 1;
			console.error(e);
		}
	);
}

// npm7 currently has a bug where it will install the GIT version of deps even when its linked in the workspace...
async function cleanDupes() {
	const candidates = await new Promise((f, e) =>
		glob('./!(node_modules)/**/node_modules/@nti/', (err, matches) =>
			err ? e(err) : f(matches)
		)
	);
	const duplicates = candidates.filter(
		(x, i, a) => !a.slice(0, i).find(y => x.startsWith(y))
	);

	await Promise.all(
		duplicates.map(x =>
			// remove the duplicate
			fs
				.rm(x, { force: true, recursive: true })
				// Remove parent directory (node_modules) if its empty
				.then(() => fs.rm(dirname(x), { force: true }))
				// ignore errors
				.catch(Boolean)
		)
	);
}

(async function main() {
	const refreshPid = parseInt(process.env.NTI_WORKSPACE_REFRESH_PID, 10);
	if (!isNaN(refreshPid)) {
		process.kill(refreshPid, 'SIGUSR2');
	}

	const spinner = ora('Processing...').start();
	await cleanDupes();

	await Promise.all([
		// Lerna isn't compatible with this workspace layout, so we just install it by itself",
		install(resolve('./scripts')),

		// Fixed as of npm v7.15.1
		//  There appears to be a bug with workspace installs not installing bundledDependencies... so we will install the service independently
		// install(resolve('./app/service')),
	]);

	spinner.stop();

	if (process.exitCode || controller.signal.aborted) {
		return;
	}

	await spawn('npm', ['run', 'build'], {
		cwd: resolve('.'),
	});

	if (NTI_BUILDOUT_PATH != null || NTI_SKIP_DOCKER != null) {
		return;
	}

	// Server requires its dependencies (content packages/client settings) be locally present (under its own node_modules)
	await spawn('npm', ['install', '--silent', '--no-audit', '--no-fund'], {
		cwd: resolve('./server'),
	});
})();
