import { promises as fs } from 'fs';
import { join } from 'path';

import { write } from './utils.js';
import { exec } from './exec.js';


export async function updateLock (dir, dryRun) {
	const output = await exec(dir, 'npm config get package-lock');
	const usesLocks = /true/i.test(output);
	if (usesLocks) {
		if (dryRun) {
			write('[dry run]: Will update lockfile...');
			write('[dry run]:  because: "npm config get package-lock": %o', output);
		} else {
			write('Updating lock file...');
			await fs.rmdir(join(dir, 'node_modules'), { recursive: true });
			await fs.unlink(join(dir, 'package-lock.json')).catch(Boolean);
			await exec(dir, 'npm install --no-progress');
		}
	}
}
