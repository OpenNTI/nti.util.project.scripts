import {promises as fs, readFileSync} from 'fs';
import {join, dirname} from 'path';

import fuzzy from 'fuzzy';
import inquirer from 'inquirer';
import inquirerCheckboxPlusPrompt from 'inquirer-checkbox-plus-prompt';
import cliProgress from 'cli-progress';
import getGithubAPI from '@nti/github-api';
import ora from 'ora';

import { exec } from './exec.js';
const {pathname} = new URL(import.meta.url);
const vscodeSettings = JSON.parse(readFileSync(join(dirname(pathname), 'vscode.json'), 'utf-8'));
const npmWorkspacePackage = JSON.parse(readFileSync(join(dirname(pathname), 'workspace-package.json'), 'utf-8'));
const npmrc = readFileSync(join(dirname(pathname), 'npmrc.ini'), 'utf-8');

inquirer.registerPrompt('checkbox-plus', inquirerCheckboxPlusPrompt);

function computeName (x, all) {
	const get = (i) => {
		let name = i.name.split('.').join('/').replace(/(^nti\/)|(\/git$)/g, '');
		if (/-/.test(name) && !/\//.test(name)) {
			name = name.replace(/-/, '/');
		}
		return name;
	};

	let name = get(x);
	all = all.map(get).filter(n => n !== name);
	if (all.some(n => name.startsWith(n + '/'))) {
		const parts = name.split('/');
		if (parts.length < 3) {throw new Error('Name conflict: ' + name);}
		const last = parts.pop();
		name = parts.join('/') + '-' + last;
	}

	return name;
}

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

	let folders = [];

	try {
		const useSubmodules = options.existing.includes(process.cwd()) && !options['no-submodules'];

		const run = async x => {
			try {
				const alias = options.aliases?.[x.fullName];
				let dest = alias || computeName(x, repos);

				dest = options.nest ? dest : dest.replace(/[/]/g, '-');

				folders.push({
					name: !options.nest ? undefined : (alias ? dest : x.name.replace(/^nti./, '')),
					path: dest,
				});

				if (useSubmodules) {
					await exec('.', `git submodule add ${x[protocol]} ${dest}`);
				}
				else {
					await exec('.', `git clone ${x[protocol]} ${dest}`);
				}
			} finally {
				cloneProgress.increment();
			}
		};

		if (!useSubmodules)	{
			await Promise.all(repos.map(run));
		}
		else {
			for (const step of repos) {
				await run(step);
			}
		}

		if (options.workspace) {
			if (!options.workspace.listed) {
				folders = [{path: '.'}];
			}

			if (!options.nest) {
				const wsp = npmWorkspacePackage.workspaces;

				const include = wsp.map(x =>
					(/^\.\/(.+)\/\*$/).exec(x)?.[1].replace(/\//g, '\\/')).filter(Boolean);

				const exclude = wsp.filter(x => /^!/.test(x));

				npmWorkspacePackage.workspaces = [
					`./(${include.join('|')})-*`,
					...exclude
				];
			}

			folders.sort((a,b) => (a.name || a.path).localeCompare(b.name || b.path));
			fs.writeFile(join(process.cwd(), 'nextthought.code-workspace'), JSON.stringify({folders, ...vscodeSettings}, null, '  '));

			fs.writeFile(join(process.cwd(), 'package.json'), JSON.stringify(npmWorkspacePackage, null, '  '));

			fs.writeFile(join(process.cwd(), '.npmrc'), npmrc);
		}

	} finally {
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

async function selectRepositories ({spinner, octokit, scope, all, existing, filter}) {
	const toValue = x => ({name: x.name, fullName: x.full_name, https: x.clone_url, ssh: x.ssh_url, git: x.git_url});
	const available = x => !x.archived && !x.disabled;

	spinner.start();
	const repositories = (await octokit.paginate(scope))
		.filter(repo => available(repo) && (!filter || filter(repo)));
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
