'use strict';

global.NTI_INIT_SCRIPTS = { start: 'app-scripts start' };

global.NTI_INIT_PACKAGE_HOOK = pkg => {
	Object.assign(pkg, {
		homepage: 'https://app.localhost/',
	});
};

require('@nti/lib-scripts/tasks/init');
