/* eslint-disable camelcase */
import * as child_process from 'child_process';

const STDIO = { stdio: 'inherit' };

export async function exec (cwd, command) {
	return new Promise((fulfill, reject) => {
		child_process.exec(command, {cwd}, (err, stdout, stderr) => {
			if (err) {
				console.error(stderr.toString('utf8'));
				return reject(err);
			}

			fulfill(stdout.toString('utf8').trim());
		});
	});
}


export function call (cmd, args, opts = STDIO, printStdError = false) {
	const env = opts.env || process.env;
	const result = child_process.spawnSync(cmd, args, {env, ...opts});

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
