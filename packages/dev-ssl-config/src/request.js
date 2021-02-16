import net from 'http';

export default async function request(...ops) {
	return new Promise((respond, fail) => {
		net.request(...ops, response => {
			const data = [];
			response
				.setEncoding('utf8')
				.on('data', chunk => data.push(chunk))
				.on('end', () => respond(Object.assign(response, { data })));
		})
			.on('error', fail)
			.end();
	});
}

export async function getFile(uri) {
	let opts = [uri, { method: 'GET' }];

	if (typeof uri === 'string') {
		const url = new URL(uri);
		// Because macOS doesn't resolve *.localhost...
		if (/\.localhost$/.test(url.hostname)) {
			opts = [
				{
					method: 'GET',
					timeout: 1000,

					setHost: false,
					host: 'localhost',
					headers: {
						host: url.hostname,
					},
					path: url.pathname,
					port: 80,
				},
			];
		}
	}

	const res = await request(...opts);
	return res.data.join('');
}
