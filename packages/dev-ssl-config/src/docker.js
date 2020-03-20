import isPortInUse from './is-port-in-use';
import request from './request';

const CONFIG_HOST = 'nti.ssl.dev.config.share.localhost';

export default async function getDockerCert () {
	if (!await isPortInUse(80)) {
		return false;
	}

	const res = await getFile().catch(() => false);

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

	const check = status === 200
		&& type === 'application/x-x509-ca-cert'
		&& /-BEGIN CERTIFICATE-/.test(data[0]);

	if (!check) {
		return false;
	}

	const prefix = `http://${CONFIG_HOST}/localhost`;

	return {
		CERT: `${prefix}.crt`,
		KEY: `${prefix}.key`,
	};
}


async function getFile (ext = 'crt') {
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
