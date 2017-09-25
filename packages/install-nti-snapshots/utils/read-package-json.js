'use strict';

const fs = require('fs');

const paths = require('./paths');

module.exports = function readPackageJson (packageJson = paths.packageJson) {
	const pkgSource = fs.readFileSync(packageJson, {encoding: 'UTF-8', flag: 'r'});
	return JSON.parse(pkgSource);
};
