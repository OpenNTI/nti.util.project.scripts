'use strict';
const { spawnSync, exec, execSync } = require('child_process');
const semver = require('semver');

const STDIO = { stdio: 'inherit' };

module.exports = call;

function call(cmd, args, opts = STDIO, printStdError = false) {
	const env = opts.env || process.env;
	const result = spawnSync(cmd, args, { env, ...opts });

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

call.exec = (cwd, cmd, cancelable) =>
	new Promise((finish, fail) => {
		let c = null;

		const unsub =
			cancelable &&
			cancelable.onCancel(() => {
				c.kill();
				fail('canceled');
			});

		const env = { ...process.env, __NTI_RELEASING: true, DEBUG: void 0 };

		c = exec(
			cmd,
			{ cwd, env, maxBuffer: 2 * 1024 * 1024 },
			(er, stdout, stderr) => {
				unsub && unsub();
				if (!cancelable || !cancelable.canceled) {
					let out = `${stderr}\n${stdout}`;
					if (er) {
						fail(
							/Command failed/i.test(er.message)
								? out
								: `${er.stack || er.message || er}\n${out}`
						);
					} else {
						finish(out);
					}
				}
			}
		);
	});

call.npx = npx;

async function npx(cmd, cwd = process.cwd()) {
	try {
		if (npx.needsFlag == null) {
			const version = execSync('npx --version', { cwd })
				.toString('utf8')
				.trim();
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
