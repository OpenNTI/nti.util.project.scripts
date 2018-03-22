'use strict';
const {spawnSync} = require('child_process');

const call = x => (x = x.split(' '), spawnSync(x[0], x.slice(1), {env: process.env, stdio: 'ignore'}));
const inspect = process.argv.slice(3).some(x => x.startsWith('--inspect'));// --inspect-brk

process.on('SIGINT', ()=> console.log('Interrupted.'));

module.exports = function run (scriptFile, args) {

	// sometimes git returns strange things...this seems to clear the bad state.
	call('git status');

	if (call('git diff-files --quiet').status !== 0
	||  call('git diff-index --quiet --cached HEAD').status !== 0) {
		console.log('There are uncommitted changes. Aborting.');
		process.exit(1);
	}

	const result = spawnSync('node',
		[
			inspect && '--inspect-brk',
			'--max-old-space-size=8192',
			scriptFile
		].filter(Boolean).concat(args),
		{ env: process.env, stdio: 'inherit' }
	);


	// Restore the package.json & lock file to original
	// the version & publish process saves the version to the lockfile
	call('git checkout package*');


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
