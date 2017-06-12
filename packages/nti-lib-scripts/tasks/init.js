'use strict';
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const paths = require('../config/paths');
const call = require('./utils/call-cmd');
const readPackageJson = require('./utils/read-package-json');
const writePackageJson = require('./utils/write-package-json');

const currentScriptsPaths = require(path.resolve(path.dirname(process.argv[1]), '../config/paths'));

const {json: pkg, indent} = readPackageJson();
const {json: libPkg} = readPackageJson(paths.ownPackageJson);
const {json: ownPkg} = readPackageJson(currentScriptsPaths.ownPackageJson);
const dropDeps = ['babel-register', ...Object.keys(Object.assign({}, libPkg.dependencies, ownPkg.dependencies))];
const scriptPackageName = ownPkg.name;

const write = x => console.log(chalk.cyan('\n' + x));

write(`Updating: ${chalk.magenta.underline('pacakge.json')}`);
//Update package.json:
// 1) add ourselves as dev deps
pkg.devDependencies[scriptPackageName] = '^' + ownPkg.version;
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
delete pkg.scripts['prepublish'];
// 	b) set "test": "${scriptPackageName} test"
pkg.scripts['test'] = `${scriptPackageName} test`;
// 	c) set "start": "${scriptPackageName} test --watch"
pkg.scripts['start'] = `${scriptPackageName} test --watch`;
// 	d) set "prepublish": "${scriptPackageName} build"
pkg.scripts['prepack'] = `${scriptPackageName} build`;
pkg.scripts['release'] = `${scriptPackageName} release`;

// save:
writePackageJson(pkg, {spaces: indent});

//Replace .babelrc, .editorconfig, .eslintignore, .eslintrc, .npmignore
const ToCopy = [
	'.babelrc',
	'.editorconfig',
	'.eslintignore',
	'.eslintrc',
	'.npmignore',
	...(global.NTI_INIT_TO_COPY || [])
];
write(`Updating/Adding: ${chalk.magenta(ToCopy.join(', '))}`);
for (let file of ToCopy) {
	const lib = path.resolve(paths.ownPath, 'config', 'init-files', file);
	const cur = path.resolve(currentScriptsPaths.ownPath, 'config', 'init-files', file);

	fs.copySync(
		fs.existsSync(lib) ? lib : cur,
		path.resolve(paths.path, file)
	);
}

//Remove rollup.config.js, karma.config.js, Makefile
//Remove './test' dir
const ToRemove = [
	'rollup.config.js',
	'karma.config.js',
	'Makefile',
	'test',
	'release.sh',
	'snapshot.sh',
	...(global.NTI_INIT_TO_REMOVE || []),
	'package-lock.json',
	'node_modules',
];
write(`Removing file/dirs that are now managed: ${chalk.magenta(ToRemove.join(', '))}`);
for (let file of ToRemove) {
	fs.removeSync(path.resolve(paths.path, file));
}

write(`Regenerate: ${chalk.magenta('package-lock.json', 'node_modules')}...`);
call('npm', ['install', '--no-progress'], {stdio: null});

write('Done.');
