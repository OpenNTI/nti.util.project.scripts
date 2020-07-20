import { promises as fs } from 'fs';
import { join } from 'path';

import { write } from './utils.js';
import { exec } from './exec.js';


export async function updateLock (dir) {
	const usesLocks = /true/i.test(await exec(dir, 'npm config get package-lock'));
	if (!usesLocks) {
		write('Updating lock file...');
		await fs.rmdir(join(dir, 'node_modules'), { recursive: true });
		await fs.unlink(join(dir, 'package-lock.json')).catch(Boolean);
		await exec(dir, 'npm install --no-progress');
	}
}
