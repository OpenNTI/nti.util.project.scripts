import {promises as fs} from 'fs';
import {join} from 'path';

import {readJSON} from './utils.js';

export const isProject = dir => async file => {
	const target = join(dir, file);
	const stat = await fs.stat(target);
	const list = stat.isDirectory() && await fs.readdir(target);
	if(list && list.includes('.git') && list.includes('package.json')) {
		try {
			const {scripts, releaseMode = 'auto'} = await readJSON(join(target, 'package.json'));
			return releaseMode !== 'interactive' && 'release' in scripts && target;
		} catch (err) {
			console.warn(err.message);
		}
	}
};

export async function listProjects (dir = process.cwd()) {
	const projects = (await Promise.all((await fs.readdir(dir)).map(isProject(dir)))).filter(Boolean);

	return projects;
}
