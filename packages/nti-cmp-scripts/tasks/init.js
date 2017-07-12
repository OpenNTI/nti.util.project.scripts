'use strict';
global.NTI_INIT_TO_COPY = [
	'.stylelintrc'
];
global.NTI_INIT_TO_REMOVE = [
	'-test', //leave the test folder alone
	'webpack.config.js',
	'webpack.config.test.js'
];
global.NTI_INIT_SCRIPT_START = 'nti-cmp-scripts start';

global.NTI_INIT_DROP_DEPENDENCIES = require('nti-app-scripts/package.json').dependencies;

require('nti-lib-scripts/tasks/init');
