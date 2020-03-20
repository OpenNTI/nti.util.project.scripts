import net from 'http';

export default async function request (...ops) {
	return new Promise(
		(respond, fail) => {
			net.request(...ops, response => {
				const data = [];
				response
					.setEncoding('utf8')
					.on('data', chunk => data.push(chunk))
					.on('end', () => respond(Object.assign(response, { data })));
			})
				.on('error', fail)
				.end();
		}
	);
}


export async function getFile (uri) {
	const res = await request(uri, {
		method: 'GET'
	});
	return res.data.join('');
}
