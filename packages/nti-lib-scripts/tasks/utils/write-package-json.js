'use strict';

const fs = require('fs-extra');

const paths = require('../../config/paths');

module.exports = function writePackageJson (json, options) {
	return fs.writeJsonSync(paths.packageJson, json, options);
};
