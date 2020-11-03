'use strict';
/*
 * Prepares a package to be a snapshot or smoketest.
 */
const fs = require('fs-extra');
const semver = require('semver');

const {lockfile, packageFile, printLine, print, getPackageNameAndVersion} = require('./util');

const {name, version, pkg, isSnapshot} = getPackageNameAndVersion();
const [stamp] = new Date().toISOString().replace(/[-T:]/g, '').split('.');


if (isSnapshot) {
	const v = semver.parse(version);

	v.prerelease.push(stamp);

	pkg.version = v.format();
	printLine('::set-output name=SNAPSHOT_ID::' + name + '@' + pkg.version);
	printLine('::set-output name=version::' + pkg.version);
	print('Preparing: %s@%s ... ', name, pkg.version);

	fs.removeSync(lockfile);

	fs.writeJsonSync(
		packageFile,
		(json => (
			[json.dependencies, json.devDependencies].forEach(deps =>
				deps && Object.keys(deps)
					.filter(x => x.startsWith('nti-') || x.startsWith('@nti/'))
					.forEach(x => (o => {
						const [src, ver] = o[x].split('#');
						if (semver.validRange(ver)) {
							o[x] = src; // strip anchors
						}
					})(deps))),
			json
		))(pkg),
		{spaces: 2}
	);
}

printLine('done.');
