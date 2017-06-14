'use strict';
const chalk = require('chalk');
const paths = require('../../config/paths');
const call = require('nti-lib-scripts/tasks/utils/call-cmd');

module.exports = function callBuildHook () {
	if (paths.appBuildHook) {
		console.log('Calling local app build hook: %s', chalk.magenta(paths.appBuildHook));

		call(process.argv[0], [paths.appBuildHook]);
	}
};
