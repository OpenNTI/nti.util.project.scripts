/*eslint import/no-extraneous-dependencies: 0*/
'use strict';
const SKIP = process.argv.includes('--skip-checks');
const DEBUG = process.argv.includes('--debug');

const path = require('path');

const chalk = require('chalk');
const fs = require('fs-extra');
const call = require('@nti/lib-scripts/tasks/utils/call-cmd');
// const sanityCheck = require('@nti/lib-scripts/tasks/utils/sanity-check');
// const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const callHook = require('@nti/app-scripts/tasks/utils/build-call-hook');
// const buildRollupBundle = require('@nti/lib-scripts/tasks/utils/build-with-rollup');
const noCjs = require('../templates/no-cjs');

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

// Warn and crash if required files are missing
// if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
// 	process.exit(1);
// }

if (!SKIP) {
	call('node', [require.resolve('./check')]);
	call('node', [require.resolve('./test')]);
}

//clean dist
fs.emptyDirSync(path.resolve(paths.path, 'lib'));


(async function build () {
	//call build hook
	await callHook();

	// await buildRollupBundle();
	// await sanityCheck();
	noCjs();


	if (!SKIP) {
		console.log('\nGenerating docs...\n');
		call('npx', ['--quiet', '@nti/gen-docs']);
	}

	// Announce complete...
	console.log(chalk.green('\nDone.\n\n'));
}());
