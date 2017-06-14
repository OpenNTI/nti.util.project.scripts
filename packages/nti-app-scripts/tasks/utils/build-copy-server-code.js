'use strict';
const fs = require('fs-extra');
const paths = require('../../config/paths');

const {
	serverComponent: SRC_SERVER,
	DIST_SERVER,
} = paths;

module.exports = function copyStaticAssets () {
	return fs.copySync(
		SRC_SERVER,
		DIST_SERVER
	);
};
