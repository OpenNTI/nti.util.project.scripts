'use strict';
const semver = require('semver');
const {
	call,
	getPackageNameAndVersion,
	ignoreErrors,
	printLine,
} = require('./util');

const { isSnapshot, name, version, publishConfig } = getPackageNameAndVersion();

if (!publishConfig || !publishConfig.registry) {
	printLine('Refusing to publish without a publishConfig.registry set');
	process.exit(1);
}

if (!isSnapshot) {
	process.env.DISABLE_SOURCE_MAPS = 'yes';
}

call('npm run build --if-present -- --skip-checks');

if (isSnapshot) {
	if (!/-alpha/.test(version)) {
		printLine('Version %s, does not have an alpha tag. Aborting.', version);
		process.exit(1);
	}

	const { stdout } = call(`npm view ${name} .versions --json`, {
		...ignoreErrors,
		fd: 'pipe',
	});
	const prevVersions = parsePrevVersions(stdout);

	//publish the snapshot (will build)
	call('npm publish --tag alpha');

	// move the snapshot tag to the current commit
	// call('git tag snapshot -f', ignoreErrors);
	call(`git tag snapshot -f -m "Cut on ${new Date()}"`, ignoreErrors);
	call('git push origin tag snapshot -f', { ...ignoreErrors, fd: 'pipe' });

	printLine('Removing previous snapshots:');
	for (let prevVersion of prevVersions) {
		call(`npm unpublish ${name}@${prevVersion}`, { forgive: true });
	}
} else {
	call('npm publish');
}

function parsePrevVersions(buffer) {
	try {
		return JSON.parse(buffer.toString())
			.filter(x => x !== version && /\d+\.\d+\.\d+-alpha/i.test(x))
			.sort(semver.compare)
			.slice(0, -1);
	} catch (e) {
		return [];
	}
}
