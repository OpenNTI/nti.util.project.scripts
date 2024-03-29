'use strict';
const path = require('path');

const paths = require('@nti/lib-scripts/config/paths');

// const ownPackageJson = require('../package.json');
// const ownPackagePath = resolveApp(`node_modules/${ownPackageJson.name}`);
// const ownPackageLinked = fs.existsSync(ownPackagePath) && fs.lstatSync(ownPackagePath).isSymbolicLink();

const { exists, resolveApp } = paths;

//eslint-disable-next-line no-shadow
function ensureSlash(path, needsSlash) {
	const hasSlash = path.endsWith('/');
	if (hasSlash && !needsSlash) {
		return path.substr(path, path.length - 1);
	} else if (!hasSlash && needsSlash) {
		return `${path}/`;
	} else {
		return path;
	}
}

function getServedPath(packageJson) {
	const homepage = require(packageJson).homepage;
	const servedUrl =
		process.env.PUBLIC_URL ||
		(homepage ? new URL(homepage, 'file://').pathname : '/');
	return ensureSlash(servedUrl, true);
}

function resolveOwn(relativePath) {
	return path.resolve(__dirname, '..', relativePath);
}

const serverComponent = exists(resolveApp('src/server'), resolveOwn('server'));

module.exports = {
	...paths,
	assetsRoot: resolveApp('src/main'),
	appHtml: resolveApp('src/main/page.html'),
	appIndexJs: resolveApp('src/main/js/index.js'),
	appBuildHook: exists(resolveApp('config/build-hook.js')),
	testsSetup: resolveApp('src/main/js/__test__/setup.js'),

	servedPath: getServedPath(resolveApp('package.json')),

	DIST_CLIENT: resolveApp('dist/client'),
	DIST_SERVER: resolveApp('dist/server'),
	PAGE: resolveApp('dist/client/page.html'),

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
	cssCustomProperties: require.resolve('@nti/style-common/variables.css'),

	serverComponent,

	baseConfig: resolveOwn('server/config/env.json'),
	localConfig: exists(resolveApp('config/service.json')),

	ownPath: resolveOwn('.'),
	ownPackageJson: resolveOwn('package.json'),
};
