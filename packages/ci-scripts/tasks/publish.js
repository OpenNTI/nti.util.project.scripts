'use strict';

const { call, getPackageNameAndVersion, nofail, printLine } = require('./util');

const { isSnapshot, name, version, publishConfig } = getPackageNameAndVersion();
const silent = {fd: 'ignore', forgive: true};

if (!publishConfig || !publishConfig.registry) {
	printLine('Refusing to publish without a publishConfig.registry set');
	return process.exit(1);
}

if (isSnapshot) {
	if (!/-alpha/.test(version)) {
		printLine('Version %s, does not have an alpha tag. Aborting.', version);
		return process.exit(1);
	}

	const {status, stdout: prevVersion} = call(`npm view ${name} .dist-tags.alpha`, {...silent, fd: 'pipe'});

	//publish the snapshot (will build)
	call('npm publish --tag alpha');

	// move the snapshot tag to the current commit
	call('git tag snapshot -f', nofail);
	call('git push origin tag snapshot -f', silent);

	if (status === 0 && prevVersion) {
		printLine('Removing previous snapshot: %s@%s', name, prevVersion);
		call(`npm unpublish ${name}@${prevVersion}`, silent);
	}
}
else {
	call('npm publish');
}
