#!/usr/bin/env node
'use strict';
const { execSync } = require('child_process');

const run = x => execSync(x, {stdio: 'pipe'}).toString('utf8');
const isJS = RegExp.prototype.test.bind(/\.(t|m?j)sx?$/i);
const isSs = RegExp.prototype.test.bind(/\.s?css$/);
const load = x => ({file: x, content: run(`git show ":${x}"`)});

process.env.NODE_ENV = 'production';
delete process.env.VSCODE_PID;
delete process.env.ATOM_HOME;

function getESLint () {
	if (!getESLint.instance) {
		const { ESLint } = require('eslint');
		getESLint.instance = new ESLint({ fix: true });
	}
	return getESLint.instance;
}

function getStyleLint () {
	if (!getStyleLint.instance) {
		getStyleLint.instance = require('stylelint');
	}
	return getStyleLint.instance;
}

async function main () {
	const files = (run('git diff --diff-filter=d --cached --name-only')?.split('\n') ?? []);
	const jsFiles = files.filter(isJS).map(load);
	const ssFiles = files.filter(isSs).map(load);

	let errors = 0;
	for (const {file, content} of jsFiles) {
		const eslint = getESLint();
		const results = await eslint.lintText(content, {filePath: file});

		errors = results.reduce((a,r) => a + r.errorCount, errors);

		const formatter = await eslint.loadFormatter('stylish');
		const resultText = formatter.format(results);
		process.stderr.write(resultText);
	}

	for (const {file, content} of ssFiles) {
		const stylelint = getStyleLint();
		const results = await stylelint.lint({
			config: require('@nti/stylelint-config-standard'),
			// configOverrides: {
			// 	rules: {
			// 		'no-missing-end-of-source-newline': false,
			// 	}
			// },
			code: content,
			codeFilename: file,
			formatter: 'string',
		});
		if (results.errored) {
			errors++;
		}
		process.stderr.write(results.output);
	}

	process.exitCode = errors > 0 ? 1 : 0;

}


main().catch((error) => {
	process.exitCode = 1;
	console.error(error);
});
