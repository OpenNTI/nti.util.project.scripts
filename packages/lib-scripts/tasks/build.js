'use strict';
const path = require('path');

const chalk = require('chalk');
const fs = require('fs-extra');
const ora = require('ora');

const Cancelable = require('./utils/cancelable');
const {exec} = require('./utils/call-cmd');
const buildBundle = require('./utils/build-with-rollup');
const sanityCheck = require('./utils/sanity-check');
const paths = require('./utils/current-script-paths');

const SKIP = process.argv.includes('--skip-checks');
const WORKER = process.env.__NTI_RELEASING || false;
const DEBUG = process.argv.includes('--debug');

process.env.BABEL_ENV = DEBUG ? 'development' : 'production';
process.env.NODE_ENV = DEBUG ? 'development' : 'production';
process.env.NTI_DEV_BROWSER = null; // Prevent dev env from producing a chrome-only build

const spinner = ora('Building...').start();

const tasks = [];
const signal = new Cancelable();
const call = (cmd, msg) => {
	const t = exec(paths.path, cmd, signal)
		.catch(x => x !== 'canceled' && (signal.cancel(), Promise.reject(x)));
	ora.promise(t, msg);
	return t;
};

const runBuild = global.runBuild || (async () => {
	//Blank out lib
	await fs.emptyDir(path.resolve(paths.path, 'lib'));

	await buildBundle();

	await sanityCheck();
});


//Expose unhandled rejected promises.
process.on('unhandledRejection', err => {
	if (err.message === 'Warnings or errors were found') {
		console.log(chalk.red(err.message));
	} else {
		console.error(chalk.red(err.stack));
	}
	process.exit(1);
});

if (WORKER) {
	runBuild();
}

if (!WORKER && !SKIP) {
	const activeScripts = path.dirname(process.argv[1]);
	tasks.push(
		call('node ' + path.resolve(activeScripts, './check'), 'Linting...'),
		call('node ' + path.resolve(activeScripts, './test'), 'Tests...'),
		call('npx --quiet @nti/gen-docs', 'Generating docs...')
	);
}

if (!WORKER) {
	tasks.push(call(process.argv.join(' '), 'Building...'));

	Promise.all(tasks)
		.then(() => {
			try {
				spinner.succeed('Done.');
			} catch (e) {/* ignore */}
		})
		.catch(er => {
			spinner.fail('Failed');
			console.log(er);
			process.exit(1);
		});
}
