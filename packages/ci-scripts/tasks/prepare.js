'use strict';
/*
 * Prepares a package to be a snapshot or smoketest.
 */
const fs = require('fs-extra');
const path = require('path');

const {print, reprint, getPackageNameAndVersion} = require('./util');

const {name, version, pkg} = getPackageNameAndVersion();
const [stamp] = new Date().toISOString().replace(/[-T:]/g, '').split('.');

const cwd = process.cwd();
const packageFile = path.join(cwd, 'package.json');
const lockfile = path.join(cwd, 'package-lock.json');


if (!/-alpha$/.test(version)) {
	print('Version %s, does not have an alpha tag. Aborting.', version);
	return process.exit(1);
}

pkg.version = `${version}.${stamp}`;

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

reprint('Preparing: %s@%s ... done.', name, pkg.version);
