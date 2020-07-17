#!/usr/bin/env node
import {execSync as exec} from 'child_process';

import getGithubAPI from '@nti/github-api';

const run = x => exec(x).toString('utf8').trim() || '';

const currentBranch = run('git branch --show-current');
const remoteBranch = run(`git rev-parse --abbrev-ref ${currentBranch}@{upstream}`);
const [origin] = remoteBranch.split('/');
const url = run(`git remote get-url ${origin}`);
const[, repoId] = url.match(/github.com[:/](.+?)(?:\.git)?$/i) ?? [];

const [owner, repo] = repoId?.split('/') ?? [];

if (owner && repo) {
	dispatch();
} else {
	console.error('This directory does not appear to bo a git repository cloned from github.');
}

async function dispatch () {
	try {
		const octokit = await getGithubAPI();
		await octokit.repos.createDispatchEvent({
			owner,
			repo,
			// eslint-disable-next-line camelcase
			event_type: 'snapshot',
		});
		console.log(`(${repoId}) Snapshot event dispatched.`);
	}
	catch(e) {
		console.error(e.message || e);
		process.exit(1);
	}
}
