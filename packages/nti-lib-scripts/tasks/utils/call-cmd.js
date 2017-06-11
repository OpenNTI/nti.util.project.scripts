'use strict';
const spawn = require('cross-spawn');

const STDIO = { stdio: 'inherit' };

module.exports = function call (cmd, args, opts = STDIO) {
	const result = spawn.sync(cmd, args, opts);
	if (result.status) {
		process.exit(result.status);
	}
};
