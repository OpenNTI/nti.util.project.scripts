import net from 'http';

export default async function isPortInUse (port) {
	return new Promise(
		(answer, error, sock = net.createServer()) =>
			sock
				.once('listening', () => sock.once('close', () => answer(false)).close())
				.once('error', err => (err.code === 'EADDRINUSE') ? answer(true) : error(err))
				.listen(port));
}

