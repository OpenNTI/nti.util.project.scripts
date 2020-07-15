import chalk from 'chalk';

import { getRepositories } from './lib/project.js';
import { releaseProject, releaseWorkspace } from './lib/workflow.js';
import { write } from './lib/utils.js';


async function main () {
	const dir = process.cwd();
	const repositories = await getRepositories(dir);

	if (repositories.length === 0) {
		write('\n\n' + chalk.red(chalk.underline(dir) + ': Could not find any repositories to release.') + '\n\n');
		process.exit(1);
	}


	if (repositories.length === 1 && repositories[0].dir === dir) {
		return releaseProject(repositories[0]);
	}

	return releaseWorkspace(repositories);
}


Promise.resolve()
	.then(main)
	.catch(e => {
		console.error('\n\nOuch... \n',e.stack || e);
	});

