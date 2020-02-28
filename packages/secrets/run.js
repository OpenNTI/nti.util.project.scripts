'use strict';
const { exec } = require('child_process');
module.exports = async function run (cmd) {
	return new Promise((done, fail) => {
		exec(cmd, (er, stdout) => er ? fail({
			error: er,
			message: `${er.message}\n${stdout.toString('utf8')}`,
			stdout: stdout.toString('utf8')
		}) : done(stdout.toString('utf8').trim()));
	});
};
