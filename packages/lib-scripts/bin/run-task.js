'use strict';

const {spawnSync} = require('child_process');

const inspect = process.argv.slice(3).some(x => x.startsWith('--inspect'));// --inspect-brk

module.exports = function run (scriptFile, name, args) {

	const result = spawnSync('node',
		[
			inspect && '--inspect-brk',
			'--max-old-space-size=8192',
			scriptFile
		].filter(Boolean).concat(args),
		{ stdio: 'inherit' });

	if (result.signal) {
		if (result.signal === 'SIGKILL') {
			console.log(
				'The build failed because the process exited too early. ' +
				'This probably means the system ran out of memory or someone called ' +
				'`kill -9` on the process.'
			);
		} else if (result.signal === 'SIGTERM') {
			console.log(
				'The build failed because the process exited too early. ' +
				'Someone might have called `kill` or `killall`, or the system could ' +
				'be shutting down.'
			);
		}
		process.exit(1);
	}

	process.exit(result.status);
};
