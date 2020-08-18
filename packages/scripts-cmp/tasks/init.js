'use strict';
const { resolve } = require('path');
const { listFiles } = require('@nti/lib-scripts/tasks/utils/read-dir');

const initFilePrefix = resolve(__dirname, '..', 'config', 'init-files');

global.NTI_INIT_TO_COPY = listFiles(initFilePrefix);
global.NTI_INIT_TO_REMOVE = [
	'-test', //leave the test folder alone
	'webpack.config.js',
	'webpack.config.test.js'
];
global.NTI_INIT_SCRIPT_START = 'cmp-scripts start';

global.NTI_INIT_DROP_DEPENDENCIES = require('@nti/app-scripts/package.json').dependencies;

require('@nti/lib-scripts/tasks/init');
