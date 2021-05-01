/*eslint-disable curly*/
'use strict';
const [PROGRAM, ...ARGS] = process.argv;
const { NTI_BUILDOUT_PATH = null } = process.env;
const DEBUG = ARGS.includes('--debug');
const INSPECT = ARGS.includes('--inspect-service');

const os = require('os');
const path = require('path');

const chalk = require('chalk');
const fs = require('fs-extra');
const color = require('json-colorz');
const tmp = require('tmp');
const call = require('@nti/lib-scripts/tasks/utils/call-cmd');

const paths = require('../config/paths');

const merge = require('./utils/merge-config');

const CONSUMED_FLAGS = new Set(['--inspect-service', __filename]);

const write = (...args) => console.log(...args);
const writeHeading = x => write(`\n${chalk.underline.magenta(x)}`);

if (paths.appBuildHook) {
	if (DEBUG)
		write(
			'Calling local app build hook: %s',
			chalk.magenta(paths.appBuildHook)
		);

	call(PROGRAM, [paths.appBuildHook]);
}

const service = require.resolve('@nti/web-service/src/index.js');
const servicePath = path.dirname(service);

const tempConfig = tmp.fileSync();

if (DEBUG)
	write(
		`Attempting to load local config override: ${
			paths.localConfig
				? chalk.magenta(paths.localConfig)
				: chalk.red('Not Found')
		}`
	);

const localConfig = paths.localConfig && fs.readJsonSync(paths.localConfig);

if (DEBUG && localConfig) write('Loaded local config override.');
if (DEBUG) write(`Loading base config: ${chalk.magenta(paths.baseConfig)}`);

const config = merge(fs.readJsonSync(paths.baseConfig), localConfig);

if (DEBUG && localConfig) write('Merged baseConfig with local override...');

if (DEBUG) write('Appending app to config...');
Object.assign(config.development, {
	apps: [
		...config.development.apps,
		{
			package: path.relative(servicePath, paths.serverComponent),
			basepath: paths.servedPath,
		},
	],
});

if (DEBUG) write('Saving config: %s\n', chalk.magenta(tempConfig.name));
fs.writeJsonSync(tempConfig.name, config);

if (DEBUG) {
	writeHeading('Resolved Config:\n');
	color(config);
}

writeHeading('Starting web-service.');

if (NTI_BUILDOUT_PATH != null) {
	if (!ARGS.find(x => /^--protocol/.test(x))) {
		write(
			chalk`
				{bold.blue NOTICE}: {bold NTI_BUILDOUT_PATH} is set, assuming {bold --protocol=proxy }
			`.replace(/\t+/g, '')
		);
		ARGS.push('--protocol', 'proxy');
	} else {
		write(
			chalk`
				{bold.yellow WARNING}: {bold NTI_BUILDOUT_PATH} is set and {bold --protocol} has been passed.
				  If the wrong protocol is used, the service will fail to
				  communicate upstream and likely crash.
			`.replace(/\t+/g, '')
		);
	}
}

const args = [
	'--env',
	'development',
	'--config',
	tempConfig.name,
	...ARGS.filter(x => !CONSUMED_FLAGS.has(x)),
];

if (DEBUG) write('with args: %s\n', chalk.magenta(args.join(' ')));

call(
	PROGRAM,
	[
		INSPECT && '--inspect-brk',
		'--trace-warnings',
		'--max-old-space-size=' + Math.floor(os.totalmem() / 1014 / 1024),
		service,
		...args,
	].filter(Boolean),
	{
		env: {
			...process.env,
			...(DEBUG
				? {}
				: {
						DEBUG: '*:error,-NodeService',
				  }),
		},
		stdio: 'inherit',
	}
);
