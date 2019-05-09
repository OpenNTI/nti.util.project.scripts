'use strict';
const chalk = require('chalk');
const path = require('path');
const call = require('@nti/lib-scripts/tasks/utils/call-cmd');
const paths = require('../config/paths');

const host = '0.0.0.0';
const port = 8000;
const {NTI_BUILDOUT_PATH = false} = process.env;

const SSL = !NTI_BUILDOUT_PATH ? [] : [
	'--https',
	'--key', path.join(NTI_BUILDOUT_PATH, 'etc/pki/localhost.key'),
	'--cert', path.join(NTI_BUILDOUT_PATH, 'etc/pki/localhost.crt')
];

if (!NTI_BUILDOUT_PATH) {
	console.error(`


	${chalk.bold(chalk.red('ERROR:'))} The environment variable ${chalk.bold('NTI_BUILDOUT_PATH')} is not defined!

	SSL will not be available until this is defined and pointing to your
	buildout directory.

	You should add this variable to your shell’s profile or in
	your virtualenv workon hook.


	`);
}

call(require.resolve('webpack-dev-server/bin/webpack-dev-server.js'), [
	'-d',
	'--history-api-fallback',
	'--config', paths.webpackDevConfig,
	'--host', host,
	'--port', port,
	'--watch',
	'--inline',
	...SSL
]);
