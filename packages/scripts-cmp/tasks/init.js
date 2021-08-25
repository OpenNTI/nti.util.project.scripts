'use strict';

global.NTI_INIT_TO_REMOVE = [
	'-test', //leave the test folder alone
];
global.NTI_INIT_SCRIPTS = {
	start: 'cmp-scripts start',
	build: 'cmp-scripts build',
};

global.NTI_INIT_DROP_DEPENDENCIES =
	require('@nti/app-scripts/package.json').dependencies;

global.NTI_INIT_PACKAGE_HOOK = pkg => {
	// pkg.devDependencies['@nti/style-common'] = 'NextThought/nti.style.common';
};

require('@nti/lib-scripts/tasks/init');
