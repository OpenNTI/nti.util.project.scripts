import isPortReachable from 'is-port-reachable';

import request from './request';

const CONFIG_HOST = 'nti.ssl.dev.config.share.localhost';

async function checkFile (ext = 'crt') {
	const res = await getFile(ext).catch(() => false);

	if (!res) {
		return false;
	}

	const {
		data,
		statusCode: status,
		headers: {
			'content-type': type
		} = {},
	} = res;

	return {
		data,
		status,
		type
	};
}


export default async function getDockerCert () {
	if (!await isPortReachable(80)) {
		return false;
	}

	const crt = await checkFile('crt');
	const key = await checkFile('key');

	if (!crt || !key) {
		return false;
	}

	const check = crt.status === 200 && key.status === 200
		&& crt.type === 'application/x-x509-ca-cert'
		&& /-BEGIN CERTIFICATE-/.test(crt.data[0])
		&& /-BEGIN PRIVATE KEY-/.test(key.data[0]);

	if (!check) {
		return null;
	}

	const prefix = `http://${CONFIG_HOST}/localhost`;

	return {
		CERT: `${prefix}.crt`,
		KEY: `${prefix}.key`,
	};
}


async function getFile (ext) {
	return request({
		method: 'GET',
		setHost: false,
		host: 'localhost',
		headers: {
			host: CONFIG_HOST
		},
		port: 80,
		path: `/localhost.${ext}`,
		timeout: 1000,
	});
}
