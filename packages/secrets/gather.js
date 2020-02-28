/* eslint-disable camelcase, no-console, import/no-commonjs */
'use strict';
const run = require('./run');
const status = require('./status');

async function gatherProjects () {
	const data = [];
	const pz = 50;
	let p = 0, page;
	do {
		status(`Listing repositories... ${data.length}`);
		page = JSON.parse(await run(`hub api -X GET orgs/NextThought/repos -f sort=full_name -f per_page=${pz} -f page=${++p}`));
		data.push(...page);
	} while (page.length === pz);

	status('');

	return data.map(({full_name, language, ...x}) => ({
		name: full_name,
		language,
		private: x.private
	}));
}

module.exports = async function all (fn) {
	const repos = await gatherProjects();
	//.filter(x => x.language === 'JavaScript')
	const report = [];
	const failures = [];
	for (const repo of repos) {
		try {
			report.push(await fn(repo.name));
		} catch (e) {
			let message = e.message;
			try {
				message = `${repo.name}: ${JSON.parse(e.stdout).message}`;
			} catch { /**/ }

			failures.push(message);
		}
	}
	status('');
	console.log(`success: ${report.length}\nfailures:\n`, failures);
};
