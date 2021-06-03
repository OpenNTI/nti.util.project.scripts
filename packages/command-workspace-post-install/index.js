#!/usr/bin/env node
import { exec, execSync } from 'child_process';
import { promises as fs } from 'fs';
import { dirname, resolve } from 'path';
import glob from 'glob';
import ora from 'ora';

if (!fs.rm) {
	console.warn(
		`

	Your version of nodejs is too old. Please use 14.14.0 or newer.

	`.replace(/\t/g, '')
	);
	process.exit(1);
}

const { NTI_BUILDOUT_PATH = null, NTI_SKIP_DOCKER = null } = process.env;

async function run(cwd, command) {
	return new Promise((fulfill, reject) => {
		exec(command, { cwd }, (err, stdout, stderr) => {
			if (err) {
				console.error(stderr.toString('utf8'));
				return reject(err);
			}

			fulfill(stdout.toString('utf8').trim());
		});
	});
}

async function install(dir) {
	await run(dir, 'npm install --no-progress --no-audit --silent').catch(e => {
		process.exitCode = 1;
		console.error(e);
	});
}

// npm7 currently has a bug where it will install the GIT version of deps even when its linked in the workspace...
function cleanDupes() {
	const candidates = glob.sync('./!(node_modules)/**/node_modules/@nti/');
	const duplicates = candidates.filter(
		(x, i, a) => !a.slice(0, i).find(y => x.startsWith(y))
	);

	for (const x of duplicates) {
		// remove the duplicate
		fs.rm(x, { force: true, recursive: true })
			// Remove parent directory (node_modules) if its empty
			.then(() => fs.rmdir(dirname(x)))
			// ignore errors
			.catch(Boolean);
	}
}

(async function main() {
	const spinner = ora('Processing...').start();
	cleanDupes();

	await Promise.all([
		// Lerna isn't compatible with this workspace layout, so we just install it by itself",
		install(resolve('./scripts')),

		// Fixed as of npm v7.15.1
		//  There appears to be a bug with workspace installs not installing bundledDependencies... so we will install the service independently
		// install(resolve('./app/service')),
	]);

	spinner.stop();

	if (process.exitCode) {
		return;
	}

	execSync('npm run build', {
		cwd: resolve('.'),
		stdio: 'inherit',
	});

	if (NTI_BUILDOUT_PATH != null || NTI_SKIP_DOCKER != null) {
		return;
	}

	// Server requires its dependencies (content packages/client settings) be locally present (under its own node_modules)
	execSync('npm install --silent', {
		cwd: resolve('./server'),
		stdio: 'inherit',
	});
})();
