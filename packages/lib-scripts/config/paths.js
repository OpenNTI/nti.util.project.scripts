'use strict';

const path = require('path');
const fs = require('fs-extra');
const r = require('escape-string-regexp');
const {isCI} = require('ci-info');

// Make sure any symlinks in the project folder are resolved:
// https://github.com/facebookincubator/create-react-app/issues/637
const appDirectory = fs.realpathSync(process.cwd());
function resolveApp (relativePath) {
	return path.resolve(appDirectory, relativePath);
}

const isDevBlocked = isCI || !!process.env.__NTI_RELEASING;

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

const nodeModules = resolveApp('node_modules');
const packageJson = resolveApp('package.json');
const _package = fs.readJsonSync(packageJson);
const ownPath = resolveOwn('.');
const ownPackageJson = fs.readJsonSync(resolveOwn('package.json'));
// const ownPackagePath = resolveApp(`node_modules/${ownPackageJson.name}`);
const [scope] = ownPackageJson.name.split('/');
const ntiModules = new RegExp(`^(${r(nodeModules)}).*${r(scope)}`);

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

	userProfile: path.resolve(process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']),

	path: resolveApp('.'),
	package: _package,
	packageJson,
	pacakgeLock: resolveApp('package-lock.json'),
	packageMain: resolveApp(_package.main),
	nodeModules,
	ntiModules,
	src: resolveApp('src'),
	testsSetup: resolveApp('src/__test__/setup.js'),

	/**
	*	Import custom properties from @nti/style-common when present.
	*	This allows postcss to fill in fallback rules for custom properties:
	*	Assuming --mycolor: red,
	*
	*		[input]
	*		color: var(--mycolor);
	*
	*		[output]
	*		color: red;
	*		color: var(--mycolor);
	*/
	cssCustomProperties: exists(resolveApp('node_modules/@nti/style-common/variables.css'), null),

	workspace: isDevBlocked ? null : exists(
		resolveApp('.workspace.json'),
		exists(
			resolveApp('../.workspace.json'),
			null
		)
	),

	nodePaths: nodePaths,

	ownPath,
	ownPackageJson: resolveOwn('package.json'),
};
