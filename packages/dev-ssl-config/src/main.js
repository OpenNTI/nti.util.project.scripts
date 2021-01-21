import path from 'path';

import chalk from 'chalk';

import getDockerCert from './docker';
import readFile from './read';
import getTempFile from './temp';

const {
	NTI_BUILDOUT_PATH = '/VALUE_NOT_SET/this/path/does/not/exist/',
} = process.env;

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
	const hint = e => 'NTI_BUILDOUT_PATH' in process.env && console.debug(e.message.replace(NTI_BUILDOUT_PATH, '$NTI_BUILDOUT_PATH/'));
	const NULL = (e) => (hint(e), void null);
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

	const DOCKER = await getDockerCert() !== false;
	const { cert, key, } = await getHTTPS() || {};

	if (!cert || !key) {

		const error = DOCKER
			? 'Docker containers are running but failed to give ssl certs'
			: 'NTI_BUILDOUT_PATH' in process.env
				? chalk`NTI_BUILDOUT_PATH is invalid.`
				: chalk`Cannot pick a path to take. {bold Docker} containers are {underline not} running and the environment variable {bold NTI_BUILDOUT_PATH} is not defined. Resolve one or the other.`;

		console.error(chalk`

	{bold.red ERROR:} ${error}

	Dev server will not work until this is resolved.

	{bold.dim Tips:}
	{dim ) Start the docker containers and/or make sure http://localhost responds to requests.}
	{dim ) If you are running buildout locally, then define the environment variable above pointing to the buildout directory.}

	`.replace(/^(\t)+/gm, '  '));
		if (process.connected) {
			process.kill(process.ppid, 'SIGKILL');
		}
		process.exit(1);
	}

}) ();
