'use strict';
const { lockfileExists, call, printLine } = require('./util');

const SUCCESS = 0;

const options = {
	forgive: true,
	env: {
		// NPM will not install devDependencies if NODE_ENV is set to production.
		// We use devDependencies to declare our build tool chain. We require devDependencies to build.
		// So override the env here.
		NODE_ENV: 'development',
	},
};

printLine('::group::Installing dependencies ... ');
const { status: result } = call(
	`npm ${!lockfileExists() ? 'i' : 'ci'} --package-lock`,
	options
);
if (result === SUCCESS) {
	printLine('done.');
	reportInstalled();
} else {
	printLine('failed!');
	process.exit(result);
}

function reportInstalled() {
	const { stdout } = call('npm list', {
		...options,
		fd: 'pipe',
	});
	printLine('Packages Installed:');

	printLine(stdout.toString('utf8'));

	printLine('-- End of Installed Packages --');
	printLine('::endgroup::');
}
