'use strict';
const fs = require('fs-extra');
const path = require('path');
const { call, printLine, print } = require('./util');

const SUCCESS = 0;
const cwd = process.cwd();
const log = path.join(cwd, '.node_modules.log');
const options = {
	fd: fs.openSync(log, 'w+'),
	forgive: true,
	env: {
		// NPM will not install devDependencies if NODE_ENV is set to production.
		// We use devDependencies to declare our build tool chain. We require devDependencies to build.
		// So override the env here.
		NODE_ENV: 'development'
	}
};

print('Installing dependencies ... ');
const result = call('npm install --parseable', options);
if (result === SUCCESS) {
	printLine('done.');
} else {
	printLine('failed!');
	printLine(fs.readFileSync(log, {encoding: 'UTF-8', flag: 'r'}));
	process.exit(result);
}
