'use strict';
require('regenerator-runtime/runtime');
const chalk = require('chalk');
const paths = require('../../config/paths');

const Mock = require('./mock');

//[Symbol.iterator]() { return { next() { return {done: true}}};}

module.exports = function () {
	try {
		console.log(
			chalk.green('Sanity-Checking node require compatibility...')
		);

		// Just evaluate the module on its own... so we mock out its requires,
		// we're just checking that this module can be evaluated

		try {
			const pkg = require(paths.packageJson);
			const mocks = require('module')._cache;
			for (let dep of Object.keys(pkg.dependencies)) {
				mocks[require.resolve(dep)] = Mock();
			}
		} catch (e) {
			console.warn(e.stack);
		}

		require(paths.packageMain);

		console.log(chalk.green.bold('Passed.'));
	} catch (e) {
		console.log(chalk.red.bold('Failed.'));
		console.log(chalk.red('\nDid you delcare all your dependencies?\n'));
		console.log(
			chalk.red(
				'This error was thrown when this module was required under node:\n'
			)
		);
		console.log(e);
		process.exit(1);
	}
};
