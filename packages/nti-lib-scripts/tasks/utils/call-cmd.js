'use strict';
const {spawnSync} = require('child_process');

const STDIO = { stdio: 'inherit' };

module.exports = function call (cmd, args, opts = STDIO, printStdError = false) {
	const env = opts.env || process.env;
	const result = spawnSync(cmd, args, {env, ...opts});

	if (result.status) {
		if (result.stderr && printStdError) {
			console.error(result.stderr.toString('utf8'));
		}
		process.exit(result.status);
	}
};
