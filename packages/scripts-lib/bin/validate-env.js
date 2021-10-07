'use strict';
const chalk = require('chalk');
const semver = require('semver');

const getVersion = require('./get-version');

const note = (ver, n) => ({ version: ver, toString: () => ver, note: n });

const npm6Note = chalk`
Please upgrade to {bold npm 7}. ({grey npm i -g npm})
With npm 7, we can utilize a new feature and improve our workflow. To get
started, after upgrading, run this command in a new empty directory:

	{grey npx -y @nti/clone --preset=webapp --workspace}

This will clone all the webapp projects into the current directory, creating
a categorized structure to group them. It will also clone the docker project
into a './server' directory. Running {grey npm install} from the new workspace
root directory will install everything, as well as build the docker container.

In this workspace, everything auto-links together and there is only one copy
of all node_modules. You will no longer need to update node_modules for config
changes, just pulling all the repos within will get you updated. The only time
we will need to reinstall node_modules is to pick up new / updated external
dependencies.
`;

const minVersions = {
	npm: [note('^6.0.0', npm6Note), '>7.15.0'],
	node: ['>=14.5.0'],
};

for (let cmd of Object.keys(minVersions)) {
	const version = getVersion(cmd);
	if (!version) {
		console.log(
			chalk.red(
				`We require ${cmd} v${minVersions[cmd]} or newer. You have do not have this command.`
			)
		);
		process.exit(1);
	}

	{
		const target = minVersions[cmd].join(' || ');
		if (!semver.satisfies(version, target)) {
			console.log(
				chalk.red(
					`We require a minimum version of ${cmd}: ${chalk.underline(
						target
					)}. You have: ${chalk.underline(version)}`
				)
			);
			process.exit(1);
		}
	}

	for (const target of minVersions[cmd]) {
		if (target.note && semver.satisfies(version, target.version)) {
			console.warn(target.note);
		}
	}
}
