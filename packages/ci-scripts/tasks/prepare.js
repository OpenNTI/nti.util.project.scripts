'use strict';
const fs = require('fs-extra');
const {spawnSync} = require('child_process');

const { call, lockfile, packageFile, printHeader, getPackageNameAndVersion } = require('./util');

const {name, version, pkg} = getPackageNameAndVersion();
const [stamp] = new Date().toISOString().replace(/[-T:]/g, '').split('.');

if (!/-alpha$/.test(version)) {
    console.log('Version %s, does not have an alpha tag. Aborting.', version);
    return process.exit(1);
}

//DATE=`date +%Y%m%d%H%M`
printHeader('Preparing build:\n  %s@%s.%s', name, version, stamp);

fs.remove(lockfile);

// download latest deps (and alphas)
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
