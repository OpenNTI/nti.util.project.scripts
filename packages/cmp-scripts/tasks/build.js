/*eslint import/no-extraneous-dependencies: 0*/
'use strict';
const SKIP = process.argv.includes('--skip-checks');
const DEBUG = process.argv.includes('--debug');

const path = require('path');

const chalk = require('chalk');
const fs = require('fs-extra');
const call = require('@nti/lib-scripts/tasks/utils/call-cmd');
// const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const callHook = require('@nti/app-scripts/tasks/utils/build-call-hook');
const buildWebpackBundle = require('@nti/app-scripts/tasks/utils/build-webpack');
const buildRollupBundle = require('@nti/lib-scripts/tasks/utils/build-with-rollup');

const paths = require('../config/paths');
const wpConfig = require('../config/webpack.config');

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
	call('node', [require.resolve('./test'), '--no-cache']);
}

//clean dist
fs.emptyDirSync(path.resolve(paths.path, 'lib'));

if (!SKIP) {
	call('npx', ['--quiet', '@nti/gen-docs']);
}

(async function build () {
	//call build hook
	await callHook();

	// Run webpack... (produces commonjs & style output)
	await buildWebpackBundle(wpConfig);

	// Run Rollup... (produces treeshake-able es module)
	console.log(chalk.green('\nBuilding ES Module...'));

	await buildRollupBundle({ignoreExisting: true});
	// Announce complete...
	console.log(chalk.green('\nDone.\n\n'));
}());
