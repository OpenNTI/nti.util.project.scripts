'use strict';
const { resolve } = require('path');
const { listFiles } = require('@nti/lib-scripts/tasks/utils/read-dir');
const chalk = require('chalk');

const initFilePrefix = resolve(__dirname, '..', 'config', 'init-files');

global.NTI_INIT_TO_COPY = listFiles(initFilePrefix);
global.NTI_INIT_TO_REMOVE = [
	'webpack.config.js'
];
global.NTI_INIT_SCRIPT_START = 'app-scripts start';

global.NTI_INIT_PACKAGE_HOOK = (pkg) => {
	Object.assign(pkg, {
		homepage: 'proxy://localhost:8083/app/'
	});
};

require('@nti/lib-scripts/tasks/init');

console.log(`

	If needed, update the ${chalk.magenta.underline('"homepage"')} property in ${chalk.magenta('package.json')}.
	We assumed: ${chalk.blue('proxy://localhost:8083/app/')}.

	When updating that value, ensure the protocol remains ${chalk.blue('proxy')} while the app is
	behind haproxy. The port number is the number the app will bind to on ${chalk.cyan('npm start')}.
	The pathname component is the base-path the app will be hosted under.

`);
