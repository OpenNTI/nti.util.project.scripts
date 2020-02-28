'use strict';
const run = require('./run');
const status = require('./status');

module.exports = async function deleteSecret (name, repo) {
	try {
		const resolve = repo == null;
		repo = repo || '{owner}/{repo}';
		status(`Deleting secret ${name}${resolve ? '' : ' on ' + repo}...`);
		await run(`hub api -X DELETE /repos/${repo}/actions/secrets/${name}`);
	} catch (e) {
		if (e.stdout !== '{}') {
			throw e;
		}
	}
};
