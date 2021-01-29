'use strict';
const { execSync } = require('child_process');
const { isCI } = require('ci-info');
// const { mkdir, readFile, writeFile } = require('fs').promises;
const {
	// basename,
	join,
	relative
} = require('path');
const { listProjects } = require('./list');
require('./validate-env.js');


const cwd = () => process.env.INIT_CWD ?? process.cwd();
const exec = (x, work = cwd()) => execSync(x, {cwd: work, env: process.env}).toString('utf8').trim();

const hooksDir = join(process.cwd(), 'hooks');

async function install (p = cwd()) {
	if (isCI) {
		return;
	}
	const dir = relative(p, hooksDir);
	try {
		process.stderr.write(
			exec('husky install ' + dir, p)
		);
	} catch (e) {
		if (/(.git can't be found)|(not allowed)/.test(e)) {
			console.error('\n\n\n\nWorkspace detected (%s)\n\n\n\n', p);
			if (p === cwd()) {
				return (await listProjects(p)).map(install);
			} 

			return exec(`git config core.hooksPath ${dir}`, p);
		}

		throw e;
	}
}

install()
	.catch(x => {
		console.error(x.stack || x);
		process.exitCode = 1;
	});
