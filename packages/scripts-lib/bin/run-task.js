'use strict';
const { totalmem } = require('os');
const { spawnSync } = require('child_process');
const semver = require('semver');
const { resolveAppDir } = require('./resolve-app-dir');

const inspect = process.argv.slice(3).some(x => x.startsWith('--inspect')); // --inspect-brk

const megabytes = bytes => Math.round(bytes / Math.pow(1024, 2));
const MIN_RAM = 8192;
const MAX_RAM = megabytes(totalmem() * 0.75);

module.exports = function run(scriptFile, name, args) {
	const result = spawnSync(
		'node',
		[
			'--trace-warnings',
			inspect && '--inspect-brk',
			'--max-old-space-size=' + Math.max(MIN_RAM, MAX_RAM),
			scriptFile,
		]
			.filter(Boolean)
			.concat(args),
		{
			cwd: resolveAppDir(process.cwd(), name),
			stdio: 'inherit',
			env: {
				...process.env,
				...(semver.lt(process.version, '17.0.0')
					? null
					: {
							// node 17 changes to OpenSSL 3, which is stricter,
							// and webpack and its various addons do not fully handle that yet,
							// so we are going to add this flag to make node's relax OpenSSL relax for now
							NODE_OPTIONS: ' --openssl-legacy-provider',
					  }),
			},
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
