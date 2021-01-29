'use strict';
const { promises: fs } = require('fs');
const { join } = require('path');

Object.assign(exports, {
	listProjects
});

const isProject = dir => async file => {
	const target = join(dir, file);
	const stat = await fs.stat(target);
	const list = stat.isDirectory() && await fs.readdir(target);
	return (list && list.includes('.git')) && target;
};

async function listProjects (dir) {
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