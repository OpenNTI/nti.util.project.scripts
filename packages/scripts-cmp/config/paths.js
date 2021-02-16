'use strict';

const path = require('path');
// const url = require('url');

const paths = require('@nti/app-scripts/config/paths');

function resolveOwn(relativePath) {
	return path.resolve(__dirname, '..', relativePath);
}

module.exports = {
	...paths,
	appModules: null,
	testApp: paths.resolveApp('test'),
	testAppHtml: paths.resolveApp('test/app/index.html'),
	testAppHtmlTemplate: resolveOwn('config/template.html'),
	ownPath: resolveOwn('.'),
	ownPackageJson: resolveOwn('package.json'),
	webpackDevConfig: resolveOwn('./config/webpack.config.js'),
	testsSetup: paths.resolveApp('src/__test__/setup.js'),
};
