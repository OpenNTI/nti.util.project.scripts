import chalk from 'chalk';

import {arg, not, getTermSize} from './utils.js';

//#region utilities
const showMetaChanges = arg('--include-meta-changes', 'workspace:Do not filter out repositories with meta only changes');
const all = arg('--all', 'workspace:List all available repositories (changed or not)');

function label (x, maxNameLength, maxTagLength) {
	const dirty = x.dirty ? '!' : '';
	const name = x.shortName?.padEnd(maxNameLength);
	const ahead = x.ahead ? `↑${x.ahead}` : '';
	const behind = x.behind ? `↓${x.behind}` : '';
	const queue = [ahead, behind, dirty].filter(Boolean).join(' ');

	const relevant = !x.metadataOnlyChanges || showMetaChanges;
	const showInfo = x.commitsSinceTag && relevant;

	const info = showInfo
		? `${(x.commitsSinceTag + ' commits since ').padStart(19)}${x.lastTag.padEnd(maxTagLength)}`
		: '';

	return `${name} ${info}\t${chalk.bold(queue)}`;
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


export async function WhatRepositories (repositories) {
	const {lines} = await getTermSize();

	return {
		message: 'Which projects do you want to release?',
		type: 'checkbox',
		pageSize: lines - 2,
		loop: false,
		choices ({type = 'release'}) {
			let choices = repositories;
			const maxNameLength = choices.reduce((n, p) => Math.max(n, p.shortName?.length || 0), 0);
			const maxTagLength = choices.reduce((n, p) => Math.max(n, p.lastTag?.length || 0), 0);
			const changed = x => x.commitsSinceTag > 0;
			const metaOnly = x => x.metadataOnlyChanges;
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

			if (type === 'release' && !all) {
				choices = choices.filter(changed);
				if (!showMetaChanges) {
					choices = choices.filter(not(metaOnly));
				}
			}

			if (choices.length === 0) {
				return [{
					name: 'No repositories found to release',
					disabled: 'Go make some changes'
				}];
			}

			return choices
				.map(x => ({
					short: x.shortName,
					name: label(x, maxNameLength, maxTagLength),
					value: x,
					disabled: x.dirty ? 'dirty' : valid(x)
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
