import { promises as fs } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

import gitState from '@nti/git-state';

import { exec } from './exec.js';

const gitStatus = promisify(gitState.check);

const isProject = dir => async file => {
	const target = join(dir, file);
	const stat = await fs.stat(target);
	const list = stat.isDirectory() && await fs.readdir(target);
	return (list && list.includes('.git')) && target;
};

async function listProjects (dir) {
	return (await Promise.all((await fs.readdir(dir)).map(isProject(dir)))).filter(Boolean);
}

async function checkStatus (dir) {
	// get the latest git state from remote
	await exec(dir, 'git fetch');

	async function resolveRemotes (branch) {
		const origins = (branch ? [branch.split('/')[0]] : (await exec(dir, 'git remote')).split(/[\r\n]+/)).filter(Boolean);
		if (!origins.length) {
			return [];
		}
		return Promise.all(origins.map(async origin => {
			const url = await exec (dir, `git remote get-url ${origin}`);
			const[, host, repo = url] = url.match(/([a-z]+\.[a-z]+)[:/](.+?)(?:\.git)?$/i) ?? [];
			return {
				url,
				repo,
				host,
				shortName: repo?.split('/')[1],
			};
		}));
	}

	// branch, remoteBranch, ahead, behind, dirty, untracked, stashes
	const status = await gitStatus(dir);

	if (!status.dirty && status.behind) {
		await exec(dir, 'git pull -r');
		status.behind = 0;
	}

	return {
		dir,
		...status,
		remotes: await resolveRemotes()
	};
}

export async function getRepositories (options, dir = process.cwd()) {
	const projects = (!options.workspace && await isProject(dir)('.')) ? [ dir ] : await listProjects(dir);
	const repos = await Promise.all(projects.map(checkStatus));

	repos.sort((a, b) => a.remotes[0].url?.localeCompare(b.remotes[0].url) || 0);

	return repos;
}

