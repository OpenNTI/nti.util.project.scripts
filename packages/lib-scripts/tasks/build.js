'use strict';
const SKIP = process.argv.includes('--skip-checks');
const DEBUG = process.argv.includes('--debug');
const path = require('path');

const chalk = require('chalk');
const fs = require('fs-extra');

const call = require('./utils/call-cmd');
const buildBundle = require('./utils/build-with-rollup');
const paths = require('../config/paths');

process.env.BABEL_ENV = DEBUG ? 'development' : 'production';
process.env.NODE_ENV = DEBUG ? 'development' : 'production';

//Expose unhandled rejected promises.
process.on('unhandledRejection', err => {
	if (err.message === 'Warnings or errors were found') {
		console.log(chalk.red(err.message));
	} else {
		console.error(chalk.red(err.stack));
	}
	process.exit(1);
});

if (!SKIP) {
	call('node', [require.resolve('./check')]);
	call('node', [require.resolve('./test'), '--no-cache']);
}

//Blank out lib
fs.emptyDirSync(path.resolve(paths.path, 'lib'));

if (!SKIP) {
	call('npx', ['--quiet', '@nti/gen-docs']);
}

(async function () {

	await buildBundle();
	console.log(chalk.green('\nDone.\n\n'));

}());
