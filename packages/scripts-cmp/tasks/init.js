'use strict';

global.NTI_INIT_TO_REMOVE = [
	'-test', //leave the test folder alone
];
global.NTI_INIT_SCRIPTS = {
	start: 'cmp-scripts start',
	storybook: 'start-storybook -p 6006',
	'build-storybook': 'build-storybook'
};

global.NTI_INIT_DROP_DEPENDENCIES = require('@nti/app-scripts/package.json').dependencies;

require('@nti/lib-scripts/tasks/init');
