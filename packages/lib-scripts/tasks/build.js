'use strict';
const path = require('path');

const chalk = require('chalk');
const fs = require('fs-extra');

const Cancelable = require('./utils/cancelable');
const {exec} = require('./utils/call-cmd');
const buildBundle = require('./utils/build-with-rollup');
const sanityCheck = require('./utils/sanity-check');
const paths = require('../config/paths');

const SKIP = process.argv.includes('--skip-checks');
const DEBUG = process.argv.includes('--debug');

process.env.BABEL_ENV = DEBUG ? 'development' : 'production';
process.env.NODE_ENV = DEBUG ? 'development' : 'production';

const tasks = [];
const signal = new Cancelable();
const call = (cmd, msg) => {
	if (msg) { console.log(msg); }
	return exec(paths.path, cmd, signal)
		.then(x => (msg && console.log(chalk.green(`${msg} finished.`)), x))
		.catch(x => x !== 'canceled' && (signal.cancel(), Promise.reject(x)));
};

const runBuild = global.runBuild || async () => {
	//Blank out lib
	await fs.emptyDir(path.resolve(paths.path, 'lib'));

	await buildBundle();

	await sanityCheck();
};


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
	tasks.push(
		call('node ' + require.resolve('./check'), 'Linting.'),
		call('node ' + require.resolve('./test'), 'Tests.')
	);
}

tasks.push(runBuild());

if (!SKIP) {
	tasks.push(call('npx --quiet @nti/gen-docs', 'Generating docs...'));
}

Promise.all(tasks)
	.then(() => console.log(chalk.green('\nDone.\n\n')))
	.catch(er => {
		console.log(chalk.red('\nFailed.\n\n', er));
		process.exit(1);
	});
