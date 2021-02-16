'use strict';
const paths = require('../../config/paths');
const { exec } = require('@nti/lib-scripts/tasks/utils/call-cmd');

module.exports = function callBuildHook() {
	if (paths.appBuildHook) {
		return exec(
			paths.path,
			[process.argv[0], paths.appBuildHook].join(' ')
		);
	}
};
