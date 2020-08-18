'use strict';
const SKIP_REGEN = process.argv.includes('--skip-regen');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const paths = require('../config/paths');
const currentScriptsPaths = require('./utils/current-script-paths');
const call = require('./utils/call-cmd');
const readPackageJson = require('./utils/read-package-json');
const writePackageJson = require('./utils/write-package-json');
const { listFiles } = require('./utils/read-dir.js');


const {json: pkg, indent} = readPackageJson();
const {json: libPkg} = readPackageJson(paths.ownPackageJson);
const {json: ownPkg} = readPackageJson(currentScriptsPaths.ownPackageJson);
const scriptPackageName = ownPkg.name;
const scriptBinName = scriptPackageName.replace(/^@nti\//, '');
const combindedDeps = { ...libPkg.dependencies, ...ownPkg.dependencies, ...global.NTI_INIT_DROP_DEPENDENCIES || {}};
const dropDeps = [
	'babel-register',
	'Jenkinsfile',
	'json-loader',
	'nti-unittesting-clientside',
	'rollup-plugin-image',
	'rollup-plugin-node-resolve',
	...Object.keys(combindedDeps)
];

const DOTFILE = '.dotfile';
const getFinalFilename = (file) =>
	(file.endsWith(DOTFILE))
		? `.${file.slice(0, -DOTFILE.length)}`
		: file;



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
delete pkg.scripts['prepack'];
delete pkg.scripts['prepublish'];
delete pkg.scripts['install-snapshots'];
// 	b) set "test": "${scriptBinName} test"
pkg.scripts['test'] = global.NTI_INIT_SCRIPT_TEST || `${scriptBinName} test`;
// 	c) set "start": "${scriptBinName} test --watch"
pkg.scripts['start'] = global.NTI_INIT_SCRIPT_START || `${scriptBinName} test --watch`;
// 	d) set "prepublish": "${scriptBinName} build"
pkg.scripts['build'] = global.NTI_INIT_SCRIPT_BUILD || global.NTI_INIT_SCRIPT_PREPACK || `${scriptBinName} build`;
pkg.scripts['clean'] = global.NTI_INIT_SCRIPT_CLEAN || `${scriptBinName} clean`;
pkg.scripts['check'] = global.NTI_INIT_SCRIPT_CHECK || `${scriptBinName} check`;
pkg.scripts['release'] = global.NTI_INIT_SCRIPT_RELEASE || `${scriptBinName} release`;
pkg.scripts['fix'] = global.NTI_INIT_SCRIPT_FIX || `${scriptBinName} fix`;

if (global.NTI_INIT_PACKAGE_HOOK) {
	global.NTI_INIT_PACKAGE_HOOK(pkg);
}

// save:
writePackageJson(pkg, {spaces: indent});


//Replace .babelrc, .editorconfig, .eslintignore, .eslintrc, .npmignore
const initFilePrefix = path.resolve(__dirname, '..', 'config', 'init-files');
const ToCopy = [
	...(new Set([//de-duplicate
		...listFiles(initFilePrefix),
		...(global.NTI_INIT_TO_COPY || [])
	]))
].sort();
write(`Updating/Adding: ${chalk.magenta(ToCopy.map(getFinalFilename).join(', '))}`);
for (let file of ToCopy) {
	const lib = path.resolve(initFilePrefix, file);
	const cur = path.resolve(currentScriptsPaths.ownPath, 'config', 'init-files', file);

	//to make dotfiles easier to bundle and not auto-ignored, lets call them '.dotfile's...and rename them on copy.
	const outFile = getFinalFilename(file);

	fs.copySync(
		fs.existsSync(cur) ? cur : lib,
		path.resolve(paths.path, outFile)
	);
}

//Remove rollup.config.js, karma.config.js, Makefile
//Remove './test' dir
const AdditionalToRemove = (global.NTI_INIT_TO_REMOVE || []).filter(x => x[0] !== '-');
const NotToRemove = (global.NTI_INIT_TO_REMOVE || []).filter(x => x[0] === '-').map(x => x.substr(1));
const ToRemove = [
	'rollup.config.js',
	'karma.config.js',
	'karma.conf.js',
	'Makefile',
	'test',
	'release.sh',
	'snapshot.sh',
	'pre-commit.sample',
	...AdditionalToRemove
].filter(x => fs.existsSync(x) && !NotToRemove.includes(x));

if (ToRemove.length > 0) {
	write(`Removing file/dirs that are now managed: ${chalk.magenta(ToRemove.join(', '))}`);
	for (let file of ToRemove) {
		fs.removeSync(path.resolve(paths.path, file));
	}
}

if (!SKIP_REGEN) {
	write(`Regenerate: ${chalk.magenta('node_modules')}...`);
	fs.removeSync(path.resolve(paths.path, 'package-lock.json'));
	fs.removeSync(path.resolve(paths.path, 'node_modules'));
	call('npm', ['install'], {stdio: 'inherit'}, true);
}

write('Done.');

console.log(`



	${chalk.blue('npm start')}:       to start development work
	${chalk.blue('npm test')}:        to test
	${chalk.blue('npm run check')}:   to run a lint check
	${chalk.blue('npm run release')}: to cut a release
	${chalk.blue('npm run build')}:   to run a build (produce artifacts only)
	${chalk.blue('npm run clean')}:   to clean project (remove build artifacts)

`);

if (fs.existsSync(paths.resolveApp('.git'))) {
	console.log(`

	Staging changes to git.
`);
	call('git', ['add',  '.', '-f'], {stdio: 'pipe'}, true);
	call('git', ['reset', 'node_modules'], {stdio: 'pipe'}, true);
}
