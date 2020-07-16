
import inquirer from 'inquirer';

import { preflightChecks, performRelease } from './project.js';
import { WhatKindOfRelease, WhatRepositories } from './questions.js';
import { arg } from './utils.js';

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
