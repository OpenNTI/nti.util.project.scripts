/*eslint-disable curly*/
'use strict';
const DEBUG = process.argv.includes('--debug');
const INSPECT = process.argv.includes('--inspect-service');
const os = require('os');
const path = require('path');
const url = require('url');

const chalk = require('chalk');
const fs = require('fs-extra');
const color = require('json-colorz');
const tmp = require('tmp');
const call = require('@nti/lib-scripts/tasks/utils/call-cmd');

const paths = require('../config/paths');

const merge = require('./utils/merge-config');

const write = (...args) => console.log(...args);
const writeHeading = x => write(`\n${chalk.underline.magenta(x)}`);


if (paths.appBuildHook) {
	if (DEBUG) write('Calling local app build hook: %s', chalk.magenta(paths.appBuildHook));

	call(process.argv[0], [paths.appBuildHook]);
}

const publicUrl = paths.publicUrl || 'https://app.localhost:8083/';
const {protocol, port = 8083} = url.parse(publicUrl);

const service = require.resolve('@nti/web-service/src/index.js');
const servicePath = path.dirname(service);

const tempConfig = tmp.fileSync();

if (DEBUG) write(`Attempting to load local config override: ${paths.localConfig ? chalk.magenta(paths.localConfig) : chalk.red('Not Found')}`);

const localConfig = paths.localConfig && fs.readJsonSync(paths.localConfig);

if (DEBUG && localConfig) write('Loaded local config override.');
if (DEBUG) write(`Loading base config: ${chalk.magenta(paths.baseConfig)}`);

const config = merge(fs.readJsonSync(paths.baseConfig), localConfig);
const server = new URL(config.development.server || '/dataserver2/', publicUrl);

// We will use the default port now for communicating to the dataserver.
// If we set this to the app port, the app will have to proxy /dataserver2/ calls... and that seems messy...
server.port = '';

if (DEBUG && localConfig) write('Merged baseConfig with local override...');

if (DEBUG) write(`Setting port to ${chalk.magenta(port)}`);
if (DEBUG) write('Appending app to config...');
Object.assign(config.development, {
	port,
	server: server.toString(),
	apps:[
		...config.development.apps,
		{
			package: path.relative(servicePath, paths.serverComponent),
			basepath: paths.servedPath
		}
	]
});

if (DEBUG) write('Saving config: %s\n', chalk.magenta(tempConfig.name));
fs.writeJsonSync(tempConfig.name, config);

if (DEBUG) {
	writeHeading('Resolved Config:\n');
	color(config);
}

writeHeading('Starting web-service.');

const args = [
	'--env', 'development',
	'--protocol', protocol.replace(/:$/,''),
	'--config', tempConfig.name
];

if (DEBUG) write('with args: %s\n', chalk.magenta(args.join(' ')));

call(process.argv[0], [
	INSPECT && '--inspect-brk',
	'--harmony-optional-chaining',
	'--harmony-nullish',
	'--max-old-space-size=' + Math.floor(os.totalmem() / 1014 / 1024),
	service,
	DEBUG && '--debug',
	...args
].filter(Boolean), {
	env: {
		...process.env,
		...(DEBUG ? {} : {
			DEBUG: '*:error,-NodeService'
		})
	},
	stdio: 'inherit'
});
