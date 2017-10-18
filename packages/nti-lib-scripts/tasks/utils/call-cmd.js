'use strict';
const {spawnSync} = require('child_process');

const STDIO = { stdio: 'inherit' };

module.exports = function call (cmd, args, opts = STDIO, printStdError = false) {
	const result = spawnSync(cmd, args, opts);
	if (result.status) {
		if (result.stderr && printStdError) {
			console.error(result.stderr.toString('utf8'));
		}
		process.exit(result.status);
	}
};
