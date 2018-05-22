'use strict';
const { call, printLine } = require('./util');

const SUCCESS = 0;

const options = {
	forgive: true,
	env: {
		// NPM will not install devDependencies if NODE_ENV is set to production.
		// We use devDependencies to declare our build tool chain. We require devDependencies to build.
		// So override the env here.
		NODE_ENV: 'development'
	}
};

printLine('Installing dependencies ... ');
const result = call('npm install --no-progress --loglevel info', options);
if (result === SUCCESS) {
	printLine('done.');
} else {
	printLine('failed!');
	process.exit(result);
}
