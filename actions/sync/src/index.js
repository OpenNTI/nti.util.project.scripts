/* eslint-disable camelcase */
'use strict';
const {promises: fs} = require('fs');
const core = require('@actions/core');

const {list} = require('./list');
const {clone} = require('./clone');
const {sync} = require('./sync');

async function main () {
	try {
		await fs.mkdir('repos');

		for (const repo of await list()) {
			await step(repo);
		}


	} catch (error) {
		core.setFailed(error.stack || error.message || error);
	}
}


async function step (repo) {
	const dir = await clone(repo);
	await sync(dir);
}

main();
