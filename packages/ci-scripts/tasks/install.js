'use strict';
const fs = require('fs-extra');
const path = require('path');
const { call, printLine, print } = require('./util');

const cwd = process.cwd();

print('Installing dependencies ... ');
call('npm install --parseable', {
	fd: fs.openSync(path.join(cwd, '.node_modules.log'), 'w+'),
	env: {
		// NPM will not install devDependencies if NODE_ENV is set to production.
		// We use devDependencies to declare our build tool chain. We require devDependencies to build.
		// So override the env here.
		NODE_ENV: 'development'
	}
});
printLine('done.');
