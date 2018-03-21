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

// NPM will not install devDependencies if NODE_ENV is set to production.
// We use devDependencies to declare our build tool chain. We require devDependencies to build.
const nodeEnv = process.env.NODE_ENV;
process.env.NODE_ENV = 'development';
call('npm ci');
process.env.NODE_ENV = nodeEnv;

call('npm publish');
