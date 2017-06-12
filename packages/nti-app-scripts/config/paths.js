'use strict';

const path = require('path');
const fs = require('fs');
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
	publicUrl: getPublicUrl(resolveApp('package.json')),
	servedPath: getServedPath(resolveApp('package.json')),

	ownPath: resolveOwn('.'),
	ownPackageJson: resolveOwn('package.json'),
});
