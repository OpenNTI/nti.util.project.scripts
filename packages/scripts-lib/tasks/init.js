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


const unTab = (strings, ...keys) => strings.map((x, i) => x + (keys[i] || '')).join('').replace(/\t+/g, '\t');

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
Object.assign(pkg.scripts, {
	// 	b) set "test": "${scriptBinName} test"
	test:		`${scriptBinName} test`,
	// 	c) set "start": "${scriptBinName} test --watch"
	start:		`${scriptBinName} test --watch`,
	// 	d) set "prepublish": "${scriptBinName} build"
	build:		`${scriptBinName} build`,
	clean:		`${scriptBinName} clean`,
	check:		`${scriptBinName} check`,
	release:	`${scriptBinName} release`,
	fix:		`${scriptBinName} fix`,
}, global.NTI_INIT_SCRIPTS || {});

if (global.NTI_INIT_PACKAGE_HOOK) {
	global.NTI_INIT_PACKAGE_HOOK(pkg);
}

// save:
writePackageJson(pkg, {spaces: indent});


//Replace .babelrc, .editorconfig, .eslintignore, .eslintrc, .npmignore
const initFilePrefix = path.resolve(__dirname, '..', 'config', 'init-files');
const initFilePrefix2 = path.resolve(currentScriptsPaths.ownPath, 'config', 'init-files');
const templatePrefix = path.resolve(currentScriptsPaths.ownPath, 'template');
const getInitFileSrc = (file, a, b) => (
	a = path.resolve(initFilePrefix, file),
	b = path.resolve(initFilePrefix2, file),
	fs.existsSync(a) ? a : fs.existsSync(b) ? b : null);
const getTemplateSrc = (file) => (
	file = path.resolve(templatePrefix, file),
	fs.existsSync(file) ? file : null);

const ToCopy = [
	...(new Set([
		//de-duplicate and merge the lib-scripts and the currently running script's init files
		...listFiles(initFilePrefix), ...listFiles(initFilePrefix2),
		...listFiles(templatePrefix),
	]))
].sort();
write(`Updating/Adding: ${chalk.magenta(ToCopy.map(getFinalFilename).join(', '))}`);
for (let file of ToCopy) {
	const src = getInitFileSrc(file) || getTemplateSrc(file);

	if (!src) {
		console.log(unTab`
			${chalk.yellow.bold('WARNING:')} Bad init file reference: ${chalk.underline(file)}
			Could not find in template nor config/init-files
		`);
		continue;
	}

	//to make dotfiles easier to bundle and not auto-ignored, lets call them '.dotfile's...and rename them on copy.
	const outFile = getFinalFilename(file);

	fs.copySync(
		src,
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
	'webpack.config.js',
	'webpack.config.test.js',
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
