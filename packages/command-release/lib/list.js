import { promises as fs } from 'fs';
import { join } from 'path';

import { readJSON } from './utils.js';

export const isProject = dir => async file => {
	const target = join(dir, file);
	const stat = await fs.stat(target);
	const list = stat.isDirectory() && (await fs.readdir(target));
	if (list && list.includes('.git') && list.includes('package.json')) {
		try {
			const {
				workspaces,
				scripts,
				releaseMode = 'auto',
			} = await readJSON(join(target, 'package.json'));
			return (
				workspaces == null &&
				releaseMode !== 'interactive' &&
				scripts &&
				'release' in scripts &&
				target
			);
		} catch (err) {
			console.warn(err.message);
		}
	}
};

export async function listProjects(dir = process.cwd()) {
	const check = isProject(dir);
	let out = [];
	for (const file of await fs.readdir(dir)) {
		const project = await check(file);
		if (project) {
			out = [...out, project];
			continue;
		}

		const target = join(dir, file);
		const stat = await fs.stat(target);
		if (stat.isDirectory() && file !== 'node_modules') {
			out = [...out, ...(await listProjects(target))];
		}
	}
	return out;
}
