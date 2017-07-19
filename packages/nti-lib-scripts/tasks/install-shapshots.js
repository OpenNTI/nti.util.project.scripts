'use strict';
const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');

const paths = require('../config/paths');

const call = require('./utils/call-cmd');
const readPackageJson = require('./utils/read-package-json');
const writePackageJson = require('./utils/write-package-json');

const write = x => console.log(chalk.cyan('\n' + x));

const {json: pkg, indent} = readPackageJson();

for (let deps of [pkg.dependencies, pkg.devDependencies]) {
	if (deps) {
		Object.keys(deps)
			.filter(x => x.startsWith('nti-'))
			.forEach(x => (o => o[x] = 'alpha')(deps));
	}
}

write('Updating package to point to snapshots...');
writePackageJson(pkg, {spaces: indent});


write(`Regenerate: ${chalk.magenta('node_modules')}...`);
fs.removeSync(path.resolve(paths.path, 'package-lock.json'));
fs.removeSync(path.resolve(paths.path, 'node_modules'));
call('npm', ['install']);

call('git', ['checkout', 'package.json', 'package-lock.json']);
