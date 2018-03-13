'use strict';

const path = require('path');
const fs = require('fs');

// Make sure any symlinks in the project folder are resolved:
// https://github.com/facebookincubator/create-react-app/issues/637
const appDirectory = fs.realpathSync(process.cwd());
function resolveApp (relativePath) {
	return path.resolve(appDirectory, relativePath);
}

// We support resolving modules according to `NODE_PATH`.
// This lets you use absolute paths in imports inside large monorepos:
// https://github.com/facebookincubator/create-react-app/issues/253.

// It works similar to `NODE_PATH` in Node itself:
// https://nodejs.org/api/modules.html#modules_loading_from_the_global_folders

// We will export `nodePaths` as an array of absolute paths.
// It will then be used by Webpack configs.
// Jest doesn’t need this because it already handles `NODE_PATH` out of the box.

// Note that unlike in Node, only *relative* paths from `NODE_PATH` are honored.
// Otherwise, we risk importing Node.js core modules into an app instead of Webpack shims.
// https://github.com/facebookincubator/create-react-app/issues/1023#issuecomment-265344421

const nodePaths = (process.env.NODE_PATH || '')
	.split(process.platform === 'win32' ? ';' : ':')
	.filter(Boolean)
	.filter(folder => !path.isAbsolute(folder))
	.map(resolveApp);

// const ownPackageJson = require('../package.json');
// const ownPackagePath = resolveApp(`node_modules/${ownPackageJson.name}`);
// const ownPackageLinked = fs.existsSync(ownPackagePath) && fs.lstatSync(ownPackagePath).isSymbolicLink();


function resolveOwn (relativePath) {
	return path.resolve(__dirname, '..', relativePath);
}

function exists (testPath, fallback) {
	return fs.existsSync(testPath) ? testPath : fallback;
}

// config: we're in ./node_modules/{ownPackageJson.name}/config/
module.exports = {
	exists,
	resolveApp,
	resolveOwn,

	path: resolveApp('.'),
	packageJson: resolveApp('package.json'),
	pacakgeLock: resolveApp('package-lock.json'),
	nodeModules: resolveApp('node_modules'),
	src: resolveApp('src'),
	testsSetup: resolveApp('src/__test__/setup.js'),
	workspace: exists(resolveApp('../.workspace.json')),

	nodePaths: nodePaths,

	ownPath: resolveOwn('.'),
	ownPackageJson: resolveOwn('package.json'),
};
