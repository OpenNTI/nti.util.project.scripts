import { promises as fs } from 'fs';

import {getFile} from './request';

export default async function readFrom (uri) {
	try {
		return await fs.readFile(uri);
	} catch (e) {
		if (!uri.startsWith('http:')) { throw e; }

		return await getFile(uri);
	}
}
