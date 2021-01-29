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

async function install (root = cwd(), leaf) {
	if (isCI) {
		return;
	}
	const execInRoot = cmd => exec(cmd, root);
	const hooksRelativeToRoot = relative(root, hooksDir);
	try {
		try {
			const gitRoot = execInRoot('git rev-parse --show-toplevel');
			const gitHooksPrefix = join(gitRoot, '.git', 'hooks');
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

		// This will fail when we are in a workspace (the root will not be a prefix of the hooks directory)
		process.stderr.write(
			execInRoot('husky install ' + hooksRelativeToRoot)
		);
	} catch (e) {

		if (/(.git can't be found)|(not allowed)/.test(e)) {
			if (root === cwd() && !leaf) {

				console.info('\n\n\n\nWorkspace detected (%s)\n', root);
				return (await listProjects(root))
					.map(x => install(x, true));
			}

			if (leaf) {
				return execInRoot(`git config core.hooksPath ${hooksRelativeToRoot}`);
			}
		}

		throw e;
	}
}

install()
	.catch(x => {
		console.error(x.stack || x);
		process.exitCode = 1;
	});
