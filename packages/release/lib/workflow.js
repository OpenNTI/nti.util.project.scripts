
import inquirer from 'inquirer';
import cliProgress from 'cli-progress';

import { preflightChecks, performRelease } from './project.js';
import { WhatKindOfRelease, WhatRepositories } from './questions.js';
import { arg } from './utils.js';
import { getGithubAPI } from './config.js';
import { exec } from './exec.js';

const FORCE_MAJOR = arg('--major', 'repo:Force a major version bump');

export async function releaseWorkspace (repositories) {
	const responses = await inquirer.prompt(await Promise.all([
		WhatKindOfRelease(repositories),
		WhatRepositories(repositories),
	]));

	const [apps, libs] = responses.queue.reduce((a, x) => (a[x.command === 'app-scripts' ? 0 : 1].push(x), a), [[], []]);

	for (const repository of [...libs, ...apps]) {
		await releaseProject(repository);
	}
}


export async function releaseProject (repository) {
	const tasks = await preflightChecks(repository, FORCE_MAJOR);

	if (tasks !== false) {
		await performRelease(tasks || [], repository, FORCE_MAJOR);
	} else {
		process.exit(1);
	}
}


export async function maybeClone () {
	const {clone} = await inquirer.prompt([
		{
			type: 'confirm',
			message: 'Would you like to clone repositories to release?',
			name: 'clone',
			default: false,
		}
	]);

	if (!clone) {
		return;
	}

	const octokit = await getGithubAPI();
	const {data: {login: username}} = await octokit.users.getAuthenticated();
	const orgs = await octokit.paginate(octokit.orgs.listForAuthenticatedUser.endpoint.merge({}));

	const {org} = await inquirer.prompt([
		{
			type: 'list',
			message: 'What organization should we scope to?',
			name: 'org',
			choices: [
				{
					name: `mine (${username})`,
					value: 'user',
					short: username
				},
				...orgs.map(x => (x.login))
			]
		}
	]);

	let scope = octokit.repos.listForUser.endpoint.merge({ username });

	if (org !== 'user') {
		const teams = await octokit.paginate(octokit.teams.list.endpoint.merge({ org }));
		const response = await inquirer.prompt([
			{
				type: 'list',
				message: 'What team should we scope to?',
				name: 'scope',
				choices: [
					{
						name: 'none (will clone every repository under the organization)',
						short: 'none',
						value: octokit.repos.listForOrg.endpoint.merge({ org })
					},
					...teams.map(x => ({
						name: x.name,
						value: octokit.teams.listReposInOrg.endpoint.merge({ org, team_slug: x.slug })
					}))
				]
			}
		]);
		scope = response.scope;
	}


	const repositories = await octokit.paginate(scope);
	const {repos} = await inquirer.prompt([
		{
			type: 'checkbox',
			message: 'Confirm repositories to clone:',
			name: 'repos',
			loop: false,
			choices: repositories.map(x => ({
				name: x.full_name,
				value: {https: x.clone_url, ssh: x.ssh_url, git: x.git_url}
			})).sort((a, b) => a.name.localeCompare(b.name))
		}
	]);


	const cloneProgress = new cliProgress.SingleBar({
		format: 'cloning [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'
	}, cliProgress.Presets.rect);
	cloneProgress.start(repos.length, 0);

	try {
		await Promise.all(repos.map(async x => {
			try {
				await exec('.', 'git clone ' + x.https);
			} finally {
				cloneProgress.increment();
			}
		}));
	}finally {
		cloneProgress.stop();
	}
}
