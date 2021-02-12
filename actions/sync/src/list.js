'use strict';
const core = require('@actions/core');
const { getOctokit } = require('@actions/github');

const token = core.getInput('token');
const targets = core.getInput('targets').split(',');
const ignored = core.getInput('ignored').split(',');
const github = getOctokit(token);

Object.assign(exports, {
	list,
});

function wanted(name) {
	const startsWith = new RegExp(
		`^NextThought/nti\\.(${targets.join('|')})\\.`,
		'i'
	);
	const shouldIgnore = new RegExp(`(${ignored.join('|')})`, 'i');
	return startsWith.test(name) && !shouldIgnore.test(name);
}

async function list() {
	const out = [];
	console.log('Fetching list of repositories...');

	const opts = github.repos.listForOrg.endpoint.merge({ org: 'NextThought' });
	const data = await github.paginate(opts);

	out.push(...data.map(x => x.full_name).filter(wanted));

	return out;
}
