'use strict';

const path = require('path');
const url = require('url');

const paths = require('nti-lib-scripts/config/paths');

// const ownPackageJson = require('../package.json');
// const ownPackagePath = resolveApp(`node_modules/${ownPackageJson.name}`);
// const ownPackageLinked = fs.existsSync(ownPackagePath) && fs.lstatSync(ownPackagePath).isSymbolicLink();

const envPublicUrl = process.env.PUBLIC_URL;

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
	assetsRoot: paths.resolveApp('src/main'),
	appModules: paths.resolveApp('src/main/js'),
	appHtml: paths.resolveApp('src/main/page.html'),
	appIndexJs: paths.resolveApp('src/main/js/index.js'),
	publicUrl: getPublicUrl(paths.resolveApp('package.json')),
	servedPath: getServedPath(paths.resolveApp('package.json')),

	SRC_SERVER: resolveOwn('server'),
	DIST_CLIENT: paths.resolveApp('dist/client'),
	DIST_SERVER: paths.resolveApp('dist/server'),
	PAGE: paths.resolveApp('dist/client/page.html'),

	serverComponent: resolveOwn('server'),
	baseConfig: resolveOwn('server/config/env.json'),

	ownPath: resolveOwn('.'),
	ownPackageJson: resolveOwn('package.json'),
});
