'use strict';

const { call, getPackageNameAndVersion, nofail } = require('./util');

const { isSnapshot } = getPackageNameAndVersion();
const silent = {fd:'ignore'};

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
