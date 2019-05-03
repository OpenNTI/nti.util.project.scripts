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

	print('Preparing: %s@%s ... ', name, pkg.version);

	fs.removeSync(lockfile);

	fs.writeJsonSync(
		packageFile,
		(json => (
			[json.dependencies, json.devDependencies].forEach(deps =>
				deps && Object.keys(deps)
					.filter(x => x.startsWith('nti-') || x.startsWith('@nti/'))
					.forEach(x => (o => o[x] = 'alpha')(deps))),
			json
		))(pkg),
		{spaces: 2}
	);
}

printLine('done.');
