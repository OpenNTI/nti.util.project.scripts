'use strict';
const { call } = require('./util');

call('npm ci', {
	env: {
		// NPM will not install devDependencies if NODE_ENV is set to production.
		// We use devDependencies to declare our build tool chain. We require devDependencies to build.
		// So override the env here.
		NODE_ENV: 'development'
	}
});
console.log('npm ci ran.\n');
