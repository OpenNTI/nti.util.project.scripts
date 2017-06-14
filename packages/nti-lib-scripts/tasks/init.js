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
const scriptPackageName = ownPkg.name;
const combindedDeps = Object.assign({}, libPkg.dependencies, ownPkg.dependencies);
const dropDeps = [
	'babel-register',
	'json-loader',
	...Object.keys(combindedDeps)
];


const write = x => console.log(chalk.cyan('\n' + x));

write(`Updating: ${chalk.magenta.underline('pacakge.json')}`);
//Update package.json:
// 1) add ourselves as dev deps
pkg.dependencies = pkg.dependencies || {};
pkg.devDependencies = pkg.devDependencies || {};
pkg.devDependencies[scriptPackageName] = '^' + ownPkg.version;

delete pkg.dependencies[scriptPackageName]; //just incase we were added without '-D'...

// 2) remove our deps from devdeps.
for (let dep of dropDeps) {
	delete pkg.devDependencies[dep];
}

//keep keys sorted
let sorted = {};
for (let dep of Object.keys(pkg.devDependencies).sort()) {
	sorted[dep] = pkg.devDependencies[dep];
}
pkg.devDependencies = sorted;

// 3) remove jest, jest-junit, and other outdated keys
delete pkg['engines'];
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
pkg.scripts['test'] = global.NTI_INIT_SCRIPT_TEST || `${scriptPackageName} test`;
// 	c) set "start": "${scriptPackageName} test --watch"
pkg.scripts['start'] = global.NTI_INIT_SCRIPT_START || `${scriptPackageName} test --watch`;
// 	d) set "prepublish": "${scriptPackageName} build"
pkg.scripts['prepack'] = global.NTI_INIT_SCRIPT_PREPACK || `${scriptPackageName} build`;
pkg.scripts['build'] = global.NTI_INIT_SCRIPT_BUILD || global.NTI_INIT_SCRIPT_PREPACK || `${scriptPackageName} build`;
pkg.scripts['release'] = global.NTI_INIT_SCRIPT_RELEASE || `${scriptPackageName} release`;

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
		fs.existsSync(cur) ? cur : lib,
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
	'pre-commit.sample',
	...(global.NTI_INIT_TO_REMOVE || [])
];
write(`Removing file/dirs that are now managed: ${chalk.magenta(ToRemove.join(', '))}`);
for (let file of ToRemove) {
	fs.removeSync(path.resolve(paths.path, file));
}

write(`Regenerate: ${chalk.magenta('package-lock.json', 'node_modules')}...`);
fs.removeSync(path.resolve(paths.path, 'package-lock.json'));
fs.removeSync(path.resolve(paths.path, 'node_modules'));
call('npm', ['install', '--no-progress'], {stdio: null}, true);

write('Done.');
