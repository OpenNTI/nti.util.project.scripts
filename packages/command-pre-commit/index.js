#!/usr/bin/env node
'use strict';
const { execSync } = require('child_process');

const run = x => execSync(x, { stdio: 'pipe' }).toString('utf8');
const isJS = RegExp.prototype.test.bind(/\.(t|m?j)sx?$/i);
const isSS = RegExp.prototype.test.bind(/\.s?css$/);
const isPackageJson = RegExp.prototype.test.bind(/package\.json$/i);
const load = x => ({ file: x, content: run(`git show ":${x}"`) });

process.env.NODE_ENV = 'production';
delete process.env.VSCODE_PID;
delete process.env.ATOM_HOME;

function getESLint() {
	if (!getESLint.instance) {
		const { ESLint } = require('eslint');
		getESLint.instance = new ESLint({ fix: true });
	}
	return getESLint.instance;
}

function getStyleLint() {
	if (!getStyleLint.instance) {
		getStyleLint.instance = require('stylelint');
	}
	return getStyleLint.instance;
}

async function main() {
	const files =
		run('git diff --diff-filter=d --cached --name-only')?.split('\n') ?? [];

	let errors = 0;
	for (const change of files) {
		const { file, content } =
			isJS(change) || isSS(change) || isPackageJson(change)
				? load(change)
				: {};

		if (isJS(change)) {
			const eslint = getESLint();
			const results = await eslint.lintText(content, { filePath: file });

			errors = results.reduce((a, r) => a + r.errorCount, errors);

			const formatter = await eslint.loadFormatter('stylish');
			const resultText = formatter.format(results);
			process.stderr.write(resultText);
		}

		if (isSS(change)) {
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

		if (isPackageJson(change)) {
			const json = JSON.parse(content);
			for (const section of [
				'dependencies',
				'devDependencies',
				'peerDependencies',
			]) {
				const sec = json[section] || {};
				for (const [key, value] of Object.entries(sec)) {
					if (/^@nti/.test(key) && value === '*') {
						errors++;
						process.stderr.write(
							`[package.json] Invalid version/git-location for ${section}.${key}. Do not commit while a refresh is in progress.`
						);
					}
				}
			}
		}
	}

	process.exitCode = errors > 0 ? 1 : 0;
}

main().catch(error => {
	process.exitCode = 1;
	console.error(error);
});
