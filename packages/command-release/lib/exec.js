/* eslint-disable camelcase */
import * as child_process from 'child_process';

import semver from 'semver';

const STDIO = { stdio: 'inherit' };

export async function exec(cwd, command, quiet = false) {
	return new Promise((fulfill, reject) => {
		child_process.exec(
			command,
			{ cwd, maxBuffer: Number.MAX_SAFE_INTEGER },
			(err, stdout, stderr) => {
				if (err) {
					if (!quiet) {
						console.error(stderr.toString('utf8') + '\ncwd:' + cwd);
					}
					return reject(err);
				}

				fulfill(stdout.toString('utf8').trim());
			}
		);
	});
}

export function execSync(cwd, command) {
	return child_process.execSync(command, { cwd }).toString('utf8').trim();
}

export function call(cmd, args, opts = STDIO, printStdError = false) {
	const env = opts.env || process.env;
	const result = child_process.spawnSync(cmd, args, { env, ...opts });

	if (result.status) {
		if (result.stderr && printStdError) {
			console.error(result.stderr.toString('utf8'));
		}
		process.exit(result.status);
	}

	if (result.stdout) {
		return result.stdout.toString('utf8');
	}
}

export async function npx(cmd, cwd = process.cwd()) {
	try {
		if (npx.needsFlag == null) {
			const version = execSync(cwd, 'npx --version');
			npx.needsFlag = semver.satisfies(version, '>=7.0.0');
		}

		return call(
			['npx', ...(npx.needsFlag ? ['--yes'] : []), cmd].join(' ')
		);
	} catch (e) {
		throw new Error(
			'Failed to execute npx.\b\nCaused by:' + (e.stack || e.message)
		);
	}
}
