'use strict';

const { call, printHeader, getPackageNameAndVersion, nofail } = require('./util');

const { name, version, isSnapshot } = getPackageNameAndVersion();
const silent = {fd:'ignore'};

printHeader('Publishing package: \n %s@s', name, version);

if (isSnapshot) {
	//publish the snapshot (will build)
	call('npm publish --tag alpha');

	// move the snapshot tag to the current commit
	call('git tag snapshot -f', nofail);
	call('git push origin tag snapshot -f', silent);
}
else {
	call('npm publish');
}
