/* eslint-disable camelcase */
import * as child_process from 'child_process';

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

export async function checkSSH () {
	return new Promise((resolve) =>
		child_process.exec('ssh -o "StrictHostKeyChecking no" -o "UserKnownHostsFile /dev/null" -T git@github.com',
			(error, stdout, stderr) => {
				resolve(/Hi .+! You've successfully authenticated/.test(`${stderr}`));
			}
		)
	);
}
