// release
'use strict';
const fs = require('fs-extra');
const { call, nofail, lockfile, printHeader, getPackageNameAndVersion } = require('./util/prepare');

const {name, version} = getPackageNameAndVersion();

if (/-alpha$/.test(version)) {
	console.log('Version %s, has an alpha tag. Aborting.', version);
	return process.exit(1);
}

printHeader('Preparing release build:\n  %s@%s', name, version);

if (fs.existsSync(lockfile)) {
	if (call('git checkout package-lock.json', nofail) !== 0) {
		fs.remove(lockfile);
	}
}

call('npm ci', {
	env: {
		// NPM will not install devDependencies if NODE_ENV is set to production.
		// We use devDependencies to declare our build tool chain. We require devDependencies to build.
		// So override the env here.
		NODE_ENV: 'development'
	}
});

call('npm publish');
