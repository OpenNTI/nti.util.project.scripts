'use strict';
const fs = require('fs-extra');
const paths = require('../../config/paths');

const { serverComponent: SRC_SERVER, DIST_SERVER } = paths;

module.exports = function copyStaticAssets() {
	//TODO: Ensure SRC_SERVER is a directory not a file.
	return fs.copySync(SRC_SERVER, DIST_SERVER);
};
