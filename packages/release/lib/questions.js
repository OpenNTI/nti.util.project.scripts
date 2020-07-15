import chalk from 'chalk';

import {not} from './utils.js';

//#region utilities

function label (x, max) {
	const name = x.shortRepo?.padEnd(max);
	const info = !x.metadataOnlyChanges && x.commitsSinceTag
		? `${(x.commitsSinceTag + ' commits since ').padStart(19)}${x.lastTag}`
		: '';

	return `${name} ${info}`;
}
//#endregion

export function WhatKindOfRelease (repositories) {
	return {
		message: 'Release or patch?',
		choices: ['release', 'patch'],
		type: 'list',
		name: 'type',
		when: () => repositories.some(x => x.branch !== 'master')
	};
}


export function WhatRepositories (repositories) {
	return {
		message: 'Which projects do you want to release?',
		type: 'checkbox',
		pageSize: 15,
		loop: false,
		choices ({type = 'release'}) {
			let choices = repositories;
			const maxNameLength = choices.reduce((n, p) => Math.max(n, p.shortRepo?.length || 0), 0);
			const valid = type === 'release'
				? x => x.branch !== 'master' && 'Not on master branch'
				: x => !x.branch.startsWith('maint-') && 'Not on a maintenance branch';

			if (type === 'patch') {
				choices = choices.filter(not(valid));
				if (choices.length === 0) {
					console.log('No patchable repositories found.');
					process.exit(1);
				}
			}

			if (type === 'release' && !process.argv.includes('--all')) {
				choices = choices.filter(x => !x.metadataOnlyChanges);
			}

			return choices
				.map(x => ({
					short: x.shortRepo,
					name: label(x, maxNameLength),
					value: x,
					disabled: valid(x)
				}));
		},
		name: 'queue'
	};
}


export function IsBehind ({behind, dir, url}) {
	return {
		type: 'list',
		name: 'behind',
		prefix: '',
		suffix: '',
		message: '\n\n' + chalk.red(chalk.underline(dir)) + ' has upstream changes...',
		default: 'exit',
		when: url && behind > 0,
		choices: [
			{
				name: 'Pull changes, and continue',
				value: 'pull',
				short: 'pulling...'
			},
			{
				name: 'Exit. (You will  need to deal with them manually)',
				value: 'exit',
				short: 'exiting...'
			},
		]
	};
}
