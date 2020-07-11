/* eslint-disable camelcase */
'use strict';
const core = require('@actions/core');
const github = require('@actions/github');

const {links} = require('./links');

const token = core.getInput('token');
const targets = core.getInput('targets').split(',');
const ignored = core.getInput('ignored').split(',');
const octokit = github.getOctokit(token);

Object.assign(exports, {
	list,
});

function wanted (name) {
	const startsWith = new RegExp(`^NextThought/nti\\.(${targets.join('|')})\\.`, 'i');
	const shouldIgnore = new RegExp(`(${ignored.join('|')})`,'i');
	return startsWith.test(name) && !shouldIgnore.test(name);
}

async function list () {
	const out = [];
	console.log('Fetching list of repositories...');

	let page = 1, done = false;
	do {
		const {data, status, /*url,*/ headers} = await octokit.repos.listForOrg({ org: 'NextThought', per_page: 100, page: page++ });
		// console.debug(status, url);

		done = status !== 200 || !links(headers.link).next;

		out.push(
			...data.map(x => x.full_name).filter(wanted)
		);
	} while(!done);

	return out;
}
