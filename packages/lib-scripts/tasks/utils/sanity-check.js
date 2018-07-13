'use strict';
require('regenerator-runtime/runtime');
const chalk = require('chalk');
const paths = require('../../config/paths');

module.exports = function () {

	try {
		console.log(chalk.green('Sanity-Checking server-side require compatibility...'));

		try {
			//known bad modules
			require('module')._cache[require.resolve('hls.js')] = {};
		} catch (e) {/**/}

		require(paths.packageMain);

		console.log(chalk.green.bold('Passed.'));
	} catch (e) {
		console.log(chalk.red.bold('Failed.'));
		console.log(e);
		process.exit(1);
	}
};
