'use strict';

const { call, getPackageNameAndVersion, nofail } = require('./util');

const { isSnapshot, version, printLine } = getPackageNameAndVersion();
const silent = {fd:'ignore'};

if (isSnapshot) {
	if (!/-alpha$/.test(version)) {
		printLine('Version %s, does not have an alpha tag. Aborting.', version);
		return process.exit(1);
	}

	//publish the snapshot (will build)
	call('npm publish --tag alpha');

	// move the snapshot tag to the current commit
	call('git tag snapshot -f', nofail);
	call('git push origin tag snapshot -f', silent);
}
else {
	call('npm publish');
}
