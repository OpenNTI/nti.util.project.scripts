'use strict';
const { call, printLine, print, lockfileExists } = require('./util');

print('::group::Installing dependencies ... ');

call(`npm ${!lockfileExists() ? 'i' : 'ci'} --package-lock`, {
	env: {
		// NPM will not install devDependencies if NODE_ENV is set to production.
		// We use devDependencies to declare our build tool chain. We require devDependencies to build.
		// So override the env here.
		NODE_ENV: 'development',
	},
});
printLine('done.');
printLine('::endgroup::');
