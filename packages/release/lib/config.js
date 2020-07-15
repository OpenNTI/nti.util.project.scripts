import netrc from 'netrc';
import inquirer from 'inquirer';
import octokit from '@octokit/rest';

let github;

export async function getToken () {
	const rc = netrc();
	try {
		const token = rc['github.com']?.password;
		if (!token) {
			throw new Error('No token');
		}

		return token;
	} catch {
		const {save, ...auth} = await inquirer.prompt([
			{
				type: 'input',
				message: 'Please enter your github username:',
				name: 'name'
			},
			{
				type: 'password',
				message: 'Please enter your github personal access token:',
				name: 'password'
			},
			{
				message: 'Save token to config?',
				name: 'save',
				type: 'confirm'
			}
		]);

		if (save) {
			netrc.save({...rc, 'github.com': auth});
		}

		return auth.password;
	}
}


export async function getGithubAPI () {
	return github || (github = Promise.resolve()
		.then(getToken)
		.then(token => new octokit.Octokit({auth: `token ${token}`})));
}
