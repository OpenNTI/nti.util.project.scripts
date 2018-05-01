'use strict';
const { call, printHeader, getPackageNameAndVersion } = require('./util');

const { name, version } = getPackageNameAndVersion();
printHeader('Installing package: \n %s@s', name, version);

call('npm ci', {
	env: {
		// NPM will not install devDependencies if NODE_ENV is set to production.
		// We use devDependencies to declare our build tool chain. We require devDependencies to build.
		// So override the env here.
		NODE_ENV: 'development'
	}
});
console.log('npm ci completed.\n');
