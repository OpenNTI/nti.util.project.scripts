'use strict';
const chalk = require('chalk');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const webpack = require('webpack');
const config = require('../../config/webpack.config');

module.exports = function build () {
	console.log('Creating an production build...');

	const compiler = webpack(config);

	return new Promise((resolve, reject) => {
		compiler.run((err, stats) => {
			if (err) {
				return reject(err);
			}

			const messages = formatWebpackMessages(stats.toJson({}, true));

			if (messages.errors.length) {
				return reject(new Error(messages.errors.join('\n\n')));
			}

			if (process.env.CI && messages.warnings.length) {
				console.log(
					chalk.yellow(
						'\nTreating warnings as errors because process.env.CI = true.\n' +
						'Most CI servers set it automatically.\n'
					)
				);
				return reject(new Error(messages.warnings.join('\n\n')));
			}

			return resolve({
				stats,
				warnings: messages.warnings,
			});
		});
	})
		.then(handleResults, handleFailure);
};


function handleFailure (err) {
	console.log(chalk.red('Failed to compile.\n'));
	console.log((err.message || err) + '\n');
	process.exit(1);
}


function handleResults ({ warnings }) {
	if (warnings.length) {
		console.log(chalk.yellow('Compiled with warnings.\n'));
		console.log(warnings.join('\n\n'));
		console.log(
			'\nSearch for the ' +
			chalk.underline(chalk.yellow('keywords')) +
			' to learn more about each warning.'
		);
		console.log(
			'To ignore, add ' +
			chalk.cyan('// eslint-disable-next-line') +
			' to the line before.\n'
		);
	} else {
		console.log(chalk.green('Compiled successfully.\n'));
	}
}
