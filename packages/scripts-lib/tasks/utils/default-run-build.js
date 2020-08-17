'use strict';
const path = require('path');
const fs = require('fs-extra');

const paths = require('./current-script-paths');

module.exports = async function runBuild () {
	//Blank out lib
	await fs.emptyDir(path.resolve(paths.path, 'lib'));

	const buildBundle = require('./utils/build-with-rollup');
	const sanityCheck = require('./utils/sanity-check');

	await buildBundle();

	await sanityCheck();
};
