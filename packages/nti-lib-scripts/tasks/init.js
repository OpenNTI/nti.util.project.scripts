'use strict';
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const paths = require('../config/paths');
const call = require('./utils/call-cmd');
const readPackageJson = require('./utils/read-package-json');
const writePackageJson = require('./utils/write-package-json');

const {json: pkg, indent} = readPackageJson();
const {json: ownPkg} = readPackageJson(paths.ownPackageJson);
const dropDeps = ['babel-register', ...Object.keys(ownPkg.dependencies)];

const write = x => console.log(chalk.cyan('\n' + x));

write(`Updating: ${chalk.magenta.underline('pacakge.json')}`);
//Update package.json:
// 1) add ourselves as dev deps
pkg.devDependencies[ownPkg.name] = '^' + ownPkg.version;
// 2) remove our deps from devdeps.
for (let dep of dropDeps) {
	delete pkg.devDependencies[dep];
}
// 3) remove jest, jest-junit keys.
delete pkg['jest'];
delete pkg['jest-junit'];

// 4) update scripts:
// 	a) unset 'preversion', 'postversion', 'bump', 'prebump', 'postbump'
delete pkg.scripts['bump'];
delete pkg.scripts['prebump'];
delete pkg.scripts['postbump'];
delete pkg.scripts['version'];
delete pkg.scripts['preversion'];
delete pkg.scripts['postversion'];
// 	b) set "test": "nti-lib-scripts test"
pkg.scripts['test'] = 'nti-lib-scripts test';
// 	c) set "start": "nti-lib-scripts test --watch"
pkg.scripts['start'] = 'nti-lib-scripts test --watch';
// 	d) set "prepublish": "nti-lib-scripts build"
pkg.scripts['prepublish'] = 'nti-lib-scripts build';

// save:
writePackageJson(pkg, {spaces: indent});

//Replace .babelrc, .editorconfig, .eslintignore, .eslintrc, .npmignore
const ToCopy = ['.babelrc', '.editorconfig', '.eslintignore', '.eslintrc', '.npmignore'];
write(`Updating/Adding: ${chalk.magenta(ToCopy.join(', '))}`);
for (let file of ToCopy) {
	fs.copySync(
		path.resolve(paths.ownPath, 'config', 'init-files', file),
		path.resolve(paths.path, file)
	);
}

//Remove rollup.config.js, karma.config.js, Makefile
//Remove './test' dir
const ToRemove = ['rollup.config.js', 'karma.config.js', 'Makefile', 'test', 'package-lock.json', 'node_modules'];
write(`Removing file/dirs that are now managed: ${chalk.magenta(ToRemove.join(', '))}`);
for (let file of ToRemove) {
	fs.removeSync(path.resolve(paths.path, file));
}

write(`Regenerate: ${chalk.magenta('package-lock.json', 'node_modules')}...`);
call('npm', ['install']);

write('Done.');
