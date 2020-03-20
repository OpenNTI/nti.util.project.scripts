import chalk from 'chalk';
import path from 'path';

import getDockerCert from './docker';
import readFile from './read';
import getTempFile from './temp';

const {
	NTI_BUILDOUT_PATH = '/VALUE_NOT_SET/this/path/does/not/exist/',
} = process.env;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function getCertPaths () {
	const DOCKER = await getDockerCert();
	const CA_ROOT = path.join(NTI_BUILDOUT_PATH, 'etc/pki/localhost');
	const {
		KEY = CA_ROOT + '.key',
		CERT = CA_ROOT + '.crt'
	} = DOCKER || {};
	return {
		KEY,
		CERT
	};
}

export async function getHTTPS () {
	const NULL = (e) => (console.debug(e), void null);
	const { KEY, CERT } = await getCertPaths();

	const [CERT_CONTENT, KEY_CONTENT ] = await Promise.all([
		readFile(CERT).catch(NULL),
		readFile(KEY).catch(NULL),
	]);

	return CERT_CONTENT && KEY_CONTENT && {
		cert: CERT_CONTENT,
		key: KEY_CONTENT,
	};
}

export async function getSSLFlags () {
	let { KEY, CERT } = await getCertPaths();

	[KEY, CERT] = await Promise.all([KEY, CERT].map(async file =>
		(/^https?:\/\//i.test(file)) ? getTempFile(await readFile(file)) : file));

	return [
		'--https',
		'--key', KEY,
		'--cert', CERT
	];
}


(async function validate () {

	const { cert, key } = await getHTTPS() || {};

	if (!cert || !key) {
		console.error(`

	${chalk.bold(chalk.red('ERROR:'))} Docker containers are not running. The environment variable ${chalk.bold('NTI_BUILDOUT_PATH')} is not defined, or is invalid.

	Dev server will not work until this is resolved.

	) Start the docker container
	) If you are running buildout locally, then define the environment variable above pointing to the buildout directory.

	`.replace(/^(\t)+/gm, '\t'));
		process.exit(1);
	}

}) ();
