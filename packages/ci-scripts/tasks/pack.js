'use strict';
const fs = require('fs-extra');
const { call, printHeader, getPackageNameAndVersion } = require('./util');

const { name, version } = getPackageNameAndVersion();
printHeader('Packing package: \n %s@s', name, version);

call('npm pack');

for( let f of fs.readdirSync(process.cwd())) {
	if (/\.tgz$/.test(f)) {
		// rm *.tgz #cleanup the tarball artifact
		fs.removeSync(f);
	}
}
console.log('npm pack completed');
