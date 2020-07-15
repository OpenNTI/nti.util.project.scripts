
import inquirer from 'inquirer';

import { preflightChecks, performRelease } from './project.js';
import { WhatKindOfRelease, WhatRepositories } from './questions.js';

export async function releaseWorkspace (repositories) {
	await inquirer.prompt([
		WhatKindOfRelease(repositories),
		WhatRepositories(repositories),
	]);
}


export async function releaseProject (repository) {
	const major = process.argv.includes('--major');

	const tasks = await preflightChecks(repository, major);

	await performRelease(tasks, repository, major);
}
