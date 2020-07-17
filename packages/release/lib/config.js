import chalk from 'chalk';
import netrc from 'netrc';
import inquirer from 'inquirer';
import octokit from '@octokit/rest';

import {write} from './utils.js';

let github;

async function getToken () {
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


async function promptForToken (rc, attempts = 0) {

	if (attempts >= 3) {
		// ✗, ✗, ✖, ✕ ?
		write(chalk.reset.bold.red('✕'), chalk.bold.gray('Too many attempts'));
		process.exit(1);
	}

	const {name, token} = await inquirer.prompt([
		{
			type: 'input',
			message: 'Please enter your github username:',
			name: 'name'
		},
		{
			type: 'password',
			message: 'Please enter your github personal access token:',
			name: 'token'
		}
	]);

	if (await checkCredentials(token)) {
		const {save} = await inquirer.prompt([{
			default:false,
			message: 'Save token to config?',
			name: 'save',
			type: 'confirm'
		}]);
		if (save) {
			netrc.save({...rc, 'github.com': {name, password: token}});
		}

		return token;
	}

	return promptForToken(rc, attempts + 1);
}

async function checkCredentials (token) {
	try {
		const api = new octokit.Octokit({auth: `token ${token}`});
		await api.users.getAuthenticated();
		return true;
	} catch (e) {
		write(chalk.reset.bold.red('!'), chalk.bold.gray(e.message));
		return false;
	}
}


export async function getGithubAPI () {
	return github || (github = Promise.resolve()
		.then(getToken)
		.then(token => new octokit.Octokit({auth: `token ${token}`})));
}
