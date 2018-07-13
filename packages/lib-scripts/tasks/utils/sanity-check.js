'use strict';
require('regenerator-runtime');
const chalk = require('chalk');
const paths = require('../../config/paths');

module.exports = function () {

	try {
		console.log(chalk.green('Sanity-Checking server-side require compatibility...'));

		require(paths.packageMain);

		console.log(chalk.green.bold('Passed.'));
	} catch (e) {
		console.log(chalk.red.bold('Failed.'));
		console.log(e);
		process.exit(1);
	}
};
