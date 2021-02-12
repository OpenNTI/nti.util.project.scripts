'use strict';
const core = require('@actions/core');
const token = core.getInput('token');
const { exec } = require('./exec');

Object.assign(exports, {
	clone,
});

async function clone(repo) {
	const [owner, name] = repo.split('/');
	const out = `${process.cwd()}/repos/${owner}-${name}`;
	await exec(
		'.',
		`git clone --depth 1 https://${token}@github.com/${repo}.git ${out}`
	);
	await exec(
		out,
		'git config user.email support@nextthought.com; git config user.name nti-jarvis'
	);
	return out;
}
