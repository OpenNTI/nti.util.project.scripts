'use strict';
const childProcess = require('child_process');

Object.assign(exports, {
	exec,
});

async function exec(cwd, command) {
	return new Promise((fulfill, reject) => {
		childProcess.exec(command, { cwd }, (err, stdout, stderr) => {
			if (err) {
				console.error(stderr.toString('utf8'));
				return reject(err);
			}

			fulfill(stdout.toString('utf8').trim());
		});
	});
}
