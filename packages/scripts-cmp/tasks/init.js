'use strict';

global.NTI_INIT_TO_REMOVE = [
	'-test', //leave the test folder alone
];
global.NTI_INIT_SCRIPTS = {start: 'cmp-scripts start'};

global.NTI_INIT_DROP_DEPENDENCIES = require('@nti/app-scripts/package.json').dependencies;

require('@nti/lib-scripts/tasks/init');
