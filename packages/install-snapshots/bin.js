#!/usr/bin/env node
'use strict';
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

const paths = require('./utils/paths');
const call = require('./utils/call-cmd');
const readPackageJson = require('./utils/read-package-json');
const writePackageJson = require('./utils/write-package-json');

const write = x => console.log(chalk.cyan('\n' + x));

const pkg = readPackageJson();

for (let deps of [pkg.dependencies, pkg.devDependencies]) {
	if (deps) {
		Object.keys(deps)
			.filter(x => x.startsWith('nti-') || x.startsWith('@nti/'))
			.forEach(x => {
				if (deps[x] !== 'next') {
					deps[x] = 'alpha';
				}
			});
	}
}

write('Updating package to point to snapshots...');
writePackageJson(pkg, {spaces: 2});


write(`Regenerate: ${chalk.magenta('node_modules')}...`);
fs.removeSync(path.resolve(paths.path, 'package-lock.json'));
fs.removeSync(path.resolve(paths.path, 'node_modules'));
call('npm', ['install']);

call('git', ['checkout', 'package.json', 'package-lock.json']);
