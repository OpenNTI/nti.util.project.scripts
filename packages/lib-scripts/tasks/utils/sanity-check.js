'use strict';
require('regenerator-runtime/runtime');
const chalk = require('chalk');
const paths = require('../../config/paths');

module.exports = function () {

	try {
		// Some 3rd party libraries use these references expecting to run in a browser...
		// and we will ensure they exist when we use them for SSR
		global.window = global.self = global;

		console.log(chalk.green('Sanity-Checking server-side require compatibility...'));

		require(paths.packageMain);

		console.log(chalk.green.bold('Passed.'));
	} catch (e) {
		console.log(chalk.red.bold('Failed.'));
		console.log(e);
		process.exit(1);
	}
};
