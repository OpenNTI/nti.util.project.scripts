'use strict';
const fs = require('fs');
const { join } = require('path');
const chalk = require('chalk');
const { isCI } = require('ci-info');
const formatMessages = require('webpack-format-messages');
const { exec } = require('@nti/lib-scripts/tasks/utils/call-cmd');
const webpack = require('webpack');
const paths = require('../../config/paths');
const pkg = require(paths.packageJson);

module.exports = main;

async function build(config = require('../../config/webpack.config')) {
	console.log('Creating a production build...');

	const compiler = webpack(config);

	const stats = await new Promise((resolve, reject) =>
		compiler.run((err, x) => (err ? reject(err) : resolve(x)))
	);

	const messages = formatMessages(stats);

	if (messages.errors.length) {
		throw new Error(messages.errors.join('\n\n'));
	}

	if (isCI && messages.warnings.length && !(pkg.build || {}).ignoreWarnings) {
		console.log(
			chalk.yellow(
				'\nTreating warnings as errors because isCI = true.\n' +
					'Most CI servers set it automatically.\n'
			)
		);
		throw new Error(messages.warnings.join('\n\n'));
	}

	return {
		stats,
		warnings: messages.warnings,
	};
}

function handleFailure(err) {
	process.stdout.write('\r\x1b[K'); //clear the current line
	console.log(chalk.red('Failed to compile.\n'));
	console.log((err.stack || err.message || err) + '\n');
	process.exit(1);
}

function handleResults({ warnings }) {
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

function computeChunkLog(stats) {
	const data = stats
		.toJson({}, true)
		.children[0].chunks.sort((a, b) =>
			a.entry !== b.entry
				? a.entry
					? 1
					: -1
				: // put initials
				a.initial === b.initial
				? 0
				: a.initial
				? -1
				: 1
		)
		.map(x => x.files.filter(RegExp.prototype.test.bind(/\.js$/)))
		.reduce((a, x) => [...a, ...x], []);

	fs.writeFileSync(
		join(paths.DIST_CLIENT, 'chunks.json'),
		JSON.stringify(data, null, 2)
	);
}

async function extractStrings() {
	return exec(
		paths.DIST_CLIENT,
		[
			process.argv[0],
			join(__dirname, 'extract-strings.js'),
			`"${paths.DIST_CLIENT}"`,
		].join(' ')
	);
}

async function main(config) {
	try {
		const results = await build(config);
		computeChunkLog(results.stats);
		await extractStrings();
		handleResults(results);
	} catch (er) {
		handleFailure(er);
	}
}
