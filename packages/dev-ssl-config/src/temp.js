import crypto from 'crypto';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import onExit from 'node-cleanup';

const files = new Set();

onExit((exitCode, signal) => {
	if (files.size > 0) {
		cleanup().then(() =>
			signal
				? // calling process.exit() won't inform parent process of signal
				  process.kill(process.pid, signal)
				: process.exit(exitCode)
		);
		return false;
	}
});

const getString = (len = 6) => {
	const hash = crypto
		.createHmac('sha256', new Date().toString())
		.update(Math.random().toString())
		.digest('hex');

	len = Math.max(6, Math.min(len, hash.length));

	const start = Math.max(0, (Math.random() % hash.length) - len);
	return hash.substr(start, len);
};

export async function getTempFile(context = '') {
	const t = await fs.mkdtemp(
		path.join(os.tmpdir(), `${context}${getString()}`)
	);
	if (files.has(t)) {
		throw new Error('Could not generate a unique temp file name.');
	}
	await fs.rm(t, { recursive: true, force: true });
	files.add(t);
	return t;
}

async function cleanup() {
	const work = Array.from(files);
	files.clear();
	for (let file of work) {
		files.delete(file);
		// console.log('Cleaning %s', file);
		fs.unlink(file).catch(() => 0);
	}
}

export default async function fileFrom(str) {
	const file = await getTempFile();
	await fs.writeFile(file, str);
	return file;
}
