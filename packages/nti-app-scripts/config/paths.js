'use strict';

const path = require('path');
const url = require('url');

const paths = require('nti-lib-scripts/config/paths');

// const ownPackageJson = require('../package.json');
// const ownPackagePath = resolveApp(`node_modules/${ownPackageJson.name}`);
// const ownPackageLinked = fs.existsSync(ownPackagePath) && fs.lstatSync(ownPackagePath).isSymbolicLink();

const envPublicUrl = process.env.PUBLIC_URL;

const {exists, resolveApp} = paths;

//eslint-disable-next-line no-shadow
function ensureSlash (path, needsSlash) {
	const hasSlash = path.endsWith('/');
	if (hasSlash && !needsSlash) {
		return path.substr(path, path.length - 1);
	} else if (!hasSlash && needsSlash) {
		return `${path}/`;
	} else {
		return path;
	}
}


function getPublicUrl (packageJson) {
	return envPublicUrl || require(packageJson).homepage;
}

function getServedPath (packageJson) {
	const publicUrl = getPublicUrl(packageJson);
	const servedUrl = envPublicUrl ||
	(publicUrl ? url.parse(publicUrl).pathname : '/');
	return ensureSlash(servedUrl, true);
}

function resolveOwn (relativePath) {
	return path.resolve(__dirname, '..', relativePath);
}


module.exports = Object.assign({}, paths, {
	assetsRoot: resolveApp('src/main'),
	appModules: resolveApp('src/main/js'),
	appHtml: resolveApp('src/main/page.html'),
	appIndexJs: resolveApp('src/main/js/index.js'),
	appBuildHook: exists(resolveApp('config/build-hook.js')),
	testsSetup: resolveApp('src/main/js/__test__/setup.js'),

	publicUrl: getPublicUrl(resolveApp('package.json')),
	servedPath: getServedPath(resolveApp('package.json')),

	DIST_CLIENT: resolveApp('dist/client'),
	DIST_SERVER: resolveApp('dist/server'),
	PAGE: resolveApp('dist/client/page.html'),

	serverComponent: exists(resolveApp('src/server'), resolveOwn('server')),
	baseConfig: resolveOwn('server/config/env.json'),
	localConfig: exists(resolveApp('config/service.json')),

	ownPath: resolveOwn('.'),
	ownPackageJson: resolveOwn('package.json'),
});
