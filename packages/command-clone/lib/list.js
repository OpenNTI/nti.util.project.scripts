import { promises as fs } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

import gitState from '@nti/git-state';

import { exec } from './exec.js';

const gitStatus = promisify(gitState.check);

const isProject = dir => async file => {
	const target = join(dir, file);
	const stat = await fs.stat(target);
	const list = stat.isDirectory() && (await fs.readdir(target));
	return list && list.includes('.git') && target;
};

async function listProjects(dir) {
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

async function resolveDetails(dir) {
	// get the latest git state from remote
	// await exec(dir, 'git fetch');

	async function resolveRemotes(branch) {
		const origins = (branch
			? [branch.split('/')[0]]
			: (await exec(dir, 'git remote')).split(/[\r\n]+/)
		).filter(Boolean);
		if (!origins.length) {
			return [];
		}
		return Promise.all(
			origins.map(async origin => {
				const url = await exec(dir, `git remote get-url ${origin}`);
				const [, host, repo = url] =
					url.match(/([a-z]+\.[a-z]+)[:/](.+?)(?:\.git)?$/i) ?? [];
				return {
					url,
					repo,
					host,
					shortName: repo?.split('/')[1],
				};
			})
		);
	}

	// branch, remoteBranch, ahead, behind, dirty, untracked, stashes
	const status = await gitStatus(dir);

	if (!status.dirty && status.behind) {
		await exec(dir, 'git pull -r');
		status.behind = 0;
	}

	const remotes = await resolveRemotes();
	return {
		dir,
		...status,
		remotes,
		fullName: remotes?.[0]?.repo,
	};
}

export async function getRepositories(options, dir = process.cwd()) {
	const projects = [
		...((await isProject(dir)('.')) ? [dir] : []),
		...(await listProjects(dir)),
	];
	const repos = await Promise.all(projects.map(resolveDetails));
	const getURL = x => x?.remotes?.[0]?.url || '';

	repos.sort((a, b) => getURL(a).localeCompare(getURL(b)));

	return repos;
}
