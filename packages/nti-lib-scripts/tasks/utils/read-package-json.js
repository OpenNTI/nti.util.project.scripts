'use strict';

const fs = require('fs-extra');
const detectIndent = require('detect-indent');

const paths = require('../../config/paths');

module.exports = function readPackageJson (packageJson = paths.packageJson) {
	const pkgSource = fs.readFileSync(packageJson, {encoding: 'UTF-8', flag: 'r'});

	const {indent} = detectIndent(pkgSource);
	const tail = pkgSource.charAt(pkgSource.length - 1) === '\n';
	const json = JSON.parse(pkgSource);

	return {
		tail,
		indent,
		json
	};
};
