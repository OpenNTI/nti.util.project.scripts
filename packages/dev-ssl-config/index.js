'use strict';
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

let {HOME, NTI_BUILDOUT_PATH = false} = process.env;

const DEV_CA = path.join(HOME, 'DevCA');

const HAS_DEV_CA = fs.existsSync(path.join(DEV_CA, 'pki'));

if (!HAS_DEV_CA && NTI_BUILDOUT_PATH && !fs.existsSync(NTI_BUILDOUT_PATH, 'etc/pki')) {
	NTI_BUILDOUT_PATH = false;
}

if (!HAS_DEV_CA && !NTI_BUILDOUT_PATH) {
	console.error(`


	${chalk.bold(chalk.red('ERROR:'))} No ${chalk.bold('~/DevCA/pki')} and the environment variable ${chalk.bold('NTI_BUILDOUT_PATH')} is not defined (or invalid)!

	SSL will not be available to webpack dev client until this is resolved.

	) The vagrant provision scripts should create ~/DevCA/pki for you.
	) If you are running buildout locally, then define the environment
	  variable above pointing to the buildout directory.

	`.replace(/^(\t)+/gm, '\t'));
	process.exit(1);
}

const CA_ROOT = HAS_DEV_CA
	? DEV_CA
	: NTI_BUILDOUT_PATH
		? path.join(NTI_BUILDOUT_PATH, 'etc')
		: false;

Object.assign(exports, {
	HTTPS: Boolean(CA_ROOT),
	SSL: !CA_ROOT ? [] : [
		'--https',
		'--key', path.join(CA_ROOT, 'pki/localhost.key'),
		'--cert', path.join(CA_ROOT, 'pki/localhost.crt')
	],
	getHTTPS: () => ({
		cert: fs.readFileSync(path.join(CA_ROOT, 'pki/localhost.crt')),
		key: fs.readFileSync(path.join(CA_ROOT, 'pki/localhost.key'))
	})
});
