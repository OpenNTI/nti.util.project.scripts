'use strict';
const { execSync } = require('child_process');
const { isCI } = require('ci-info');
const { existsSync, unlink } = require('fs');
const {
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
		try {
			const gitHooksPrefix = join(exec('git rev-parse --show-toplevel', p), '.git', 'hooks');
			const oldHooks = [
				join(gitHooksPrefix, 'pre-commit'),
				join(gitHooksPrefix, 'prepare-commit-msg')
			];
			
			for (const file of oldHooks) {
				if (existsSync(file)) {
					unlink(file);
				}
			}
		} catch { /**/ }

		process.stderr.write(
			exec('husky install ' + dir, p)
		);
	} catch (e) {
		if (/(.git can't be found)|(not allowed)/.test(e)) {
			if (p === cwd()) {
				console.error('\n\n\n\nWorkspace detected (%s)\n\n\n\n', p);
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
