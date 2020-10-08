#!/bin/sh
# unset VSCODE_PID
# unset ATOM_HOME
set -e
export NODE_ENV=production
node <<'JS_CODE'
const { execSync } = require('child_process');
const { ESLint } = require("eslint");

const run = x => execSync(x, {stdio: 'pipe'}).toString('utf8').trim();
const isJS = RegExp.prototype.test.bind(/\.(t|m?j)sx?$/i);

(async function main() {
	const eslint = new ESLint({ fix: true });
	const files = (run('git diff --diff-filter=d --cached --name-only')?.split('\n') ?? [])
		.filter(isJS)
		.map(x => ({file: x, content: run(`git show ":${x}"`)}));

	let errors = 0;
	for (const {file, content} of files) {
		const results = await eslint.lintText(content, {filePath: file});

		errors = results.reduce((a,r) => a + r.errorCount, errors);

		const formatter = await eslint.loadFormatter("stylish");
		const resultText = formatter.format(results);
		process.stderr.write(resultText);
	}

	process.exitCode = errors > 0 ? 1 : 0;

})().catch((error) => {
	process.exitCode = 1;
	console.error(error);
});
JS_CODE
