import { promises as fs } from 'fs';
import { join } from 'path';

import { write } from './utils.js';
import { exec } from './exec.js';

const isTrue = RegExp.prototype.test.bind(/true/i);

export async function usesLock(dir) {
	return (
		isTrue(await exec(dir, 'npm config get package-lock')) ||
		isTrue(await exec(dir, 'npm config get package-lock-releases'))
	);
}

export async function updateLock(dir, dryRun) {
	const usesLocks = await usesLock(dir);
	if (usesLocks) {
		if (dryRun) {
			write('[dry run]: Will update lockfile...');
			write('[dry run]:  because: "npm config get package-lock": true');
			write(
				'[dry run]:       or: "npm config get package-lock-releases": true'
			);
		} else {
			write('Updating lock file...');
			await fs.rm(join(dir, 'node_modules'), {
				recursive: true,
				force: true,
			});
			await fs
				.rm(join(dir, 'package-lock.json'), { force: true })
				.catch(Boolean);
			await exec(dir, 'npm install --no-progress --package-lock=true');
		}
	}
}
