'use strict';
const spawn = require('cross-spawn');

const STDIO = { stdio: 'inherit' };

module.exports = function call (cmd, args, opts = STDIO, printStdError = false) {
	const result = spawn.sync(cmd, args, opts);
	if (result.status) {
		if (result.stderr && printStdError) {
			console.error(result.stderr.toString('utf8'));
		}
		process.exit(result.status);
	}
};
