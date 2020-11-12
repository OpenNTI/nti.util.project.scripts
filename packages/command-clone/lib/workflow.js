
import fuzzy from 'fuzzy';
import inquirer from 'inquirer';
import inquirerCheckboxPlusPrompt from 'inquirer-checkbox-plus-prompt';
import cliProgress from 'cli-progress';
import getGithubAPI from '@nti/github-api';
import ora from 'ora';

import { exec } from './exec.js';

inquirer.registerPrompt('checkbox-plus', inquirerCheckboxPlusPrompt);

export async function clone (options) {
	const octokit = await getGithubAPI();
	const spinner = ora('Loading...');

	let repos = [], protocol = 'https';

	try {
		spinner.start();
		const {data: {login: username}} = await octokit.users.getAuthenticated();
		spinner.stop();

		const scope = await getScope({spinner, octokit, username, ...options});
		protocol = await selectProtocol(options);
		repos = await selectRepositories({spinner, octokit, scope, ...options});
	} catch (e) {
		spinner.stop();
		if (e.status === 404 || e.request) {
			console.error('Invalid options:', e.message + '\n\t' + e.request?.url);
			process.exit(1);
		}
		throw e;
	}

	const cloneProgress = new cliProgress.SingleBar({
		format: 'cloning [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'
	}, cliProgress.Presets.rect);
	cloneProgress.start(repos.length, 0);

	try {
		await Promise.all(repos.map(async x => {
			try {
				await exec('.', 'git clone ' + x[protocol]);
			} finally {
				cloneProgress.increment();
			}
		}));
	}finally {
		cloneProgress.stop();
	}
}

async function getScope (options) {
	const {username, octokit} = options;
	const org = await getOrg(options);
	if (org === 'user') {
		return octokit.repos.listForUser.endpoint.merge({ username });
	}
	return getOrgScope({org, ...options});
}

async function getOrg ({octokit, spinner, username, ...options}) {
	const preselect = options.user ? 'user' : options.org;
	if (preselect) {
		return preselect;
	}

	spinner.start();
	const orgs = await octokit.paginate(octokit.orgs.listForAuthenticatedUser.endpoint.merge({}));
	spinner.stop();
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

	return org;
}

async function getOrgScope ({octokit, spinner, org, ...options}) {
	let selection = options.team;
	if (selection == null) {
		spinner.start();
		const teams = await octokit.paginate(octokit.teams.list.endpoint.merge({ org }));
		spinner.stop();
		const response = await inquirer.prompt([
			{
				type: 'list',
				message: 'What team should we scope to?',
				name: 'scope',
				choices: [
					{
						name: 'none (will clone every repository under the organization)',
						short: 'none',
						value: '*'
					},
					...teams.map(x => ({
						name: x.name,
						value: x.slug
					}))
				]
			}
		]);
		selection = response.scope;
	}

	return /^[-*]{0,1}$/.test(selection)
		? octokit.repos.listForOrg.endpoint.merge({ org })
		: octokit.teams.listReposInOrg.endpoint.merge({ org, 'team_slug': selection });
}

async function selectProtocol ({protocol}) {
	if (!/^(https|ssh|git)$/.test(protocol)) {
		const response = await inquirer.prompt([
			{
				type: 'list',
				message: 'Which protocol should we use?',
				name: 'protocol',
				loop: false,
				default: 'https',
				choices: [
					'https',
					'ssh',
					'git'
				]
			}
		]);
		protocol = response.protocol;
	}

	return protocol;
}

async function selectRepositories ({spinner, octokit, scope, all, existing}) {
	const toValue = x => ({name: x.name, fullName: x.full_name, https: x.clone_url, ssh: x.ssh_url, git: x.git_url});

	spinner.start();
	const repositories = (await octokit.paginate(scope)).filter(({archived,disabled}) => !archived && !disabled);
	spinner.stop();

	if (all) {
		return repositories.map(toValue);
	}

	const choices = repositories.map(x => {
				const match = existing.find(({remotes}) => remotes.find(({url}) => [x.clone_url, x.ssh_url, x.git_url].includes(url)));
				return {
					name: x.full_name + (!match ? '' : ` (${match.dir})`),
					disabled: match && 'already exists',
					value: toValue(x)
				};
	}).sort((a, b) => a.name.localeCompare(b.name));

	const {repos} = await inquirer.prompt([
		{
			type: 'checkbox-plus',
			message: 'Confirm repositories to clone:',
			name: 'repos',
			highlight: true,
			searchable: true,
			loop: false,
			choices,
			source: async function (answersSoFar, input) {
				input = input || '';
				return fuzzy.filter(input, choices, {extract: x => x.name}).map(x => x.original);
			}
		}
	]);

	return repos;
}
