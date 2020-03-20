'use strict';
const chalk = require('chalk');

global.NTI_INIT_SCRIPTS = {start: 'app-scripts start'};

global.NTI_INIT_PACKAGE_HOOK = (pkg) => {
	Object.assign(pkg, {
		homepage: 'proxy://app.localhost:8083/app/'
	});
};

require('@nti/lib-scripts/tasks/init');

console.log(`

	If needed, update the ${chalk.magenta.underline('"homepage"')} property in ${chalk.magenta('package.json')}.
	We assumed: ${chalk.blue('proxy://app.localhost:8083/app/')}.

	When updating that value, ensure the protocol remains ${chalk.blue('proxy')} while the app is
	behind haproxy. The port number is the number the app will bind to on ${chalk.cyan('npm start')}.
	The pathname component is the base-path the app will be hosted under.

`);
