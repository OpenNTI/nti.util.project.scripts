#!/usr/bin/env node
'use strict';
const { execSync } = require('child_process');
const { readFile, writeFile } = require('fs').promises;

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

function getFilesInCommit() {
	return (
		run('git diff --diff-filter=d --cached --name-only')?.split('\n') ?? []
	).filter(x => x?.length);
}

async function main() {
	let errors = 0;
	const files = getFilesInCommit();

	if (files.length === 0) {
		errors++;
		process.stderr.write('Nothing to commit.\n');
	}

	for (const change of files) {
		const { file, content } =
			isJS(change) || isSS(change) || isPackageJson(change)
				? load(change)
				: {};

		if (isJS(change)) {
			const eslint = getESLint();
			const results = await eslint.lintText(content, { filePath: file });
			const [{ filePath, output } = {}] = results;

			const changeErrors = results.reduce((a, r) => a + r.errorCount, 0);
			errors += changeErrors;
			// output is only set when eslint fixed something...
			if (changeErrors === 0 && output) {
				// capture the contents of the file on disk just incase the stage is partial...
				const current = await readFile(filePath, { encoding: 'utf8' });
				try {
					await writeFile(filePath, output);
					run(`git add ${filePath}`);
				} finally {
					// restore if staged content does not match on-disk content
					if (content.trim() !== current.trim()) {
						await writeFile(filePath, current);
					}
				}
			}

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

	if (files.length > 0 && getFilesInCommit().length === 0) {
		errors++;
		process.stderr.write(
			'After fixes, the commit is now empty. Nothing to do.\n'
		);
	}

	process.exitCode = errors > 0 ? 1 : 0;
}

main().catch(error => {
	process.exitCode = 1;
	console.error(error);
});
