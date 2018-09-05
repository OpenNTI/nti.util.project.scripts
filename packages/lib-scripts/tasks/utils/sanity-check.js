'use strict';
require('regenerator-runtime/runtime');
const chalk = require('chalk');
const paths = require('../../config/paths');

const Mock = () => new Proxy(
	() => Mock(), //the Target (the thing we are proxying)... a callable function
	{
		//the get() hook...
		get: (_, p) =>
			//If caller wants to unbox the primitive... return a function that generates a string
			p === Symbol.toPrimitive
				? () => String(Date.now())
			// Otherwise return another Mock
				: Mock()
	}
);

module.exports = function () {

	try {
		console.log(chalk.green('Sanity-Checking node require compatibility...'));

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
		console.log(chalk.red('This error was thrown when this module was require()`d under node:'));
		console.log(e);
		process.exit(1);
	}
};
