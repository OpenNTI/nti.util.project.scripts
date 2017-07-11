'use strict';

const path = require('path');
// const url = require('url');

const paths = require('nti-app-scripts/config/paths');

function resolveOwn (relativePath) {
	return path.resolve(__dirname, '..', relativePath);
}

module.exports = Object.assign({}, paths, {
	appModules: null,
	ownPath: resolveOwn('.'),
	ownPackageJson: resolveOwn('package.json'),
	webpackDevConfig: resolveOwn('./config/webpack.config.test.js'),
});
