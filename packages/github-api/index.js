import { execSync as exec } from 'child_process';

import chalk from 'chalk';
import netrc from 'netrc';
import inquirer from 'inquirer';
import octokit from '@octokit/rest';

let github;
const write = (...args) => console.log(...args);

async function getToken() {
	const rc = netrc();
	try {
		const token = rc['github.com']?.password;
		if (!token) {
			throw new Error('No token');
		}

		return token;
	} catch {
		return promptForToken(rc);
	}
}

async function promptForToken(rc, attempts = 0) {
	if (attempts >= 3) {
		// ✗, ✗, ✖, ✕ ?
		write(chalk.reset.bold.red('✕'), chalk.bold.gray('Too many attempts'));
		process.exit(1);
	}

	const { name, token } = await inquirer.prompt([
		{
			type: 'input',
			message: 'Please enter your github username:',
			name: 'name',
		},
		{
			type: 'password',
			message: 'Please enter your github personal access token:',
			name: 'token',
		},
	]);

	if (await checkCredentials(token)) {
		const { save } = await inquirer.prompt([
			{
				default: false,
				message: 'Save token to config?',
				name: 'save',
				type: 'confirm',
			},
		]);
		if (save) {
			netrc.save({ ...rc, 'github.com': { name, password: token } });
		}

		return token;
	}

	return promptForToken(rc, attempts + 1);
}

async function checkCredentials(token) {
	try {
		const api = new octokit.Octokit({ auth: `token ${token}` });
		await api.users.getAuthenticated();
		return true;
	} catch (e) {
		write(chalk.reset.bold.red('!'), chalk.bold.gray(e.message));
		return false;
	}
}

export default async function getGithubAPI() {
	return (
		github ||
		(github = Promise.resolve()
			.then(getToken)
			.then(token => new octokit.Octokit({ auth: `token ${token}` })))
	);
}

/**
 * @typedef {Object} RepositoryRef
 * @property {string} owner
 * @property {string} repo
 */

/**
 *
 * @param {string|RepositoryRef} to -
 * @param {string} eventType -
 * @returns {void}
 */
export async function dispatchEvent(to, eventType) {
	const { owner, repo, repoId = [owner, repo].join('/') } =
		typeof to === 'string' ? resolveGithubProject(to) : to;
	const api = await getGithubAPI();
	await api.repos.createDispatchEvent({
		owner,
		repo,
		event_type: eventType,
	});

	return {
		message: `(${repoId}) ${eventType} event dispatched.`,
	};
}

export function resolveGithubProject(dir = process.cwd()) {
	const run = x =>
		exec(x, { cwd: dir, stdio: 'pipe' }).toString('utf8').trim() || '';
	try {
		const currentBranch = run('git rev-parse --abbrev-ref HEAD');
		// const currentBranch = run('git branch --show-current');
		const remoteBranch = run(
			`git rev-parse --abbrev-ref ${currentBranch}@{upstream}`
		);
		const [origin] = remoteBranch.split('/');
		const url = run(`git remote get-url ${origin}`);
		const [, repoId] = url.match(/github.com[:/](.+?)(?:\.git)?$/i) ?? [];

		const [owner, repo] = repoId?.split('/') ?? [];
		if (!owner || !repo) {
			throw new Error('NOT_GITHUB_REMOTE');
		}
		return {
			owner,
			repo,
			repoId,
		};
	} catch {
		throw new Error('Not in a git repository?');
	}
}
