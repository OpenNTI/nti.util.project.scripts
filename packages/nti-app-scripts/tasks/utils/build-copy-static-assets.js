'use strict';
const fs = require('fs-extra');
const path = require('path');

const paths = require('../../config/paths');

const {
	DIST_CLIENT,
} = paths;

const IGNORED_FILES = [
	/\.DS_Store/,
	/\/js$/, //JS files & the js directory
	/\/fonts$/, // fonts directory
	/\/mocks$/, // mocks directory
	/\/scss$/,  // scss directory
];

module.exports = function copyStaticAssets () {
	return fs.copySync(
		path.resolve(paths.src, 'main'),
		DIST_CLIENT,
		{filter: (src) => !IGNORED_FILES.some(x => x.test(src))}
	);
};
