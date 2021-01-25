'use strict';
const chalk = require('chalk');
const semver = require('semver');

const getVersion = require('./get-version');

const minVersions = {
	npm: ['6.0.0', '7.0.0'],
	node: ['14.5.0'],
};

for (let cmd of Object.keys(minVersions)) {
	const version = getVersion(cmd);
	if (!version) {
		console.log(chalk.red(`We require ${cmd} v${minVersions[cmd]} or newer. You have do not have this command.`));
		process.exit(1);
	}

	if (!semver.satisfies(version, minVersions[cmd].map(x => `>=${x}`).join(' || '))) {
		console.log(chalk.red(`We require a minimum version of ${cmd}: ${chalk.underline(minVersions[cmd])}. You have: ${chalk.underline(version)}`));
		process.exit(1);
	}
}
