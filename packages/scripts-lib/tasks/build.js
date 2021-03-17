'use strict';
const path = require('path');

const chalk = require('chalk');
const ora = require('ora');

const Cancelable = require('./utils/cancelable');
const { exec, npx } = require('./utils/call-cmd');
const paths = require('./utils/current-script-paths');

const SKIP =
	process.argv.includes('--skip-checks') ||
	process.argv.includes('--dev-build');
const WORKER = process.env.__NTI_RELEASING || false || SKIP;
const DEBUG = process.argv.includes('--debug');

process.env.BABEL_ENV = DEBUG ? 'development' : 'production';
process.env.NODE_ENV = DEBUG ? 'development' : 'production';
process.env.NTI_DEV_BROWSER = null; // Prevent dev env from producing a chrome-only build
process.env.__NTI_WORKSPACE = JSON.stringify({}); // Prevent dev workspace links in build

//Expose unhandled rejected promises.
process.on('unhandledRejection', err => {
	if (err.message === 'Warnings or errors were found') {
		console.log(chalk.red(err.message));
	} else {
		console.error(chalk.red(err.stack || err));
	}
	process.exit(1);
});

const activeScripts = path.dirname(process.argv[1]);

if (WORKER) {
	(async () => {
		if (global.runBuild) {
			await exec(
				paths.path,
				'node ' + path.resolve(activeScripts, './clean')
			);
			global.runBuild();
		} else {
			console.log('This project is not built nor packaged individually.');
		}
	})();
} else {
	const spinner = ora('Building...').start();
	const tasks = [];
	const signal = new Cancelable();
	const task = (p, label) => {
		if (typeof p === 'string') {
			p = exec(paths.path, p, signal).catch(
				x =>
					x !== 'canceled' &&
					(console.error(x), signal.cancel(), Promise.reject(x))
			);
		}
		ora.promise(p, label);
		return p;
	};
	const subTask = (t, label) =>
		task(`node ${path.resolve(activeScripts, t)}`, label);

	if (!SKIP) {
		tasks.push(
			subTask('./check', 'Linting...'),
			subTask('./test', 'Tests...'),
			task(npx('@nti/gen-docs'), 'Generating docs...')
		);
	}

	tasks.push(task(process.argv.join(' '), 'Building...'));

	Promise.all(tasks)
		.then(() => {
			try {
				spinner.succeed('Done.');
			} catch (e) {
				/* ignore */
			}
		})
		.catch(er => {
			spinner.fail('Failed');
			console.log(er.stack || er.message || er);
			process.exit(1);
		});
}
