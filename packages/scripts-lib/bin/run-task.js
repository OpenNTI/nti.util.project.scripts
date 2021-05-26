'use strict';
const { totalmem } = require('os');
const { spawnSync } = require('child_process');
const { resolveAppDir } = require('./resolve-app-dir');

const inspect = process.argv.slice(3).some(x => x.startsWith('--inspect')); // --inspect-brk

const megabytes = bytes => Math.round(bytes / Math.pow(1024, 2));
const MIN_RAM = 8192;
const MAX_RAM = megabytes(totalmem() * 0.75);

module.exports = function run(scriptFile, name, args) {
	const result = spawnSync(
		'node',
		[
			inspect && '--inspect-brk',
			'--max-old-space-size=' + Math.max(MIN_RAM, MAX_RAM),
			scriptFile,
		]
			.filter(Boolean)
			.concat(args),
		{
			cwd: resolveAppDir(process.cwd(), name),
			stdio: 'inherit',
		}
	);

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
