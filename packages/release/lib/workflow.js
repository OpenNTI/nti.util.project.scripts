
import inquirer from 'inquirer';

import { preflightChecks, performRelease } from './project.js';
import { WhatKindOfRelease, WhatRepositories } from './questions.js';

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
	const major = process.argv.includes('--major');

	const tasks = await preflightChecks(repository, major);

	if (tasks !== false) {
		await performRelease(tasks || [], repository, major);
	} else {
		process.exit(1);
	}
}
