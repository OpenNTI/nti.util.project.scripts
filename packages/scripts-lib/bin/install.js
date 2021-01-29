'use strict';
const { execSync } = require('child_process');
const { isCI } = require('ci-info');
const { existsSync, unlink, appendFileSync } = require('fs');
const {
	join,
	relative
} = require('path');
const { listProjects } = require('./list');
require('./validate-env.js');

const cwd = () => process.env.INIT_CWD ?? process.cwd();
const exec = (x, work = cwd()) => execSync(x, {cwd: work, env: process.env}).toString('utf8').trim();

const hooksDir = join(process.cwd(), 'hooks');

const log = (msg) => appendFileSync('~/.install.log', msg + '\n');


async function install (root = cwd(), leaf = false) {
	if (isCI || /\/\.npm|tmp\//.test(hooksDir)) {
		return;
	}

	if (!leaf) {
		log(`New install:\n\t${process.env.INIT_CWD}\n\t${process.cwd()}\n\t${hooksDir}`);
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
					log(`Removed: ${file}`);
				}
			}
		} catch { /**/ }

		// This will fail when we are in a workspace (the root will not be a prefix of the hooks directory)
		log(
			execInRoot('husky install ' + hooksRelativeToRoot)
		);
	} catch (e) {

		if (/(.git can't be found)|(not allowed)/.test(e)) {
			if (root === cwd() && !leaf) {

				log(`Workspace detected (${root})`);
				return Promise.all((await listProjects(root))
					.map(x => install(x, true)));
			}

			if (leaf) {
				log(`Setting hooks dir ${root} to ${hooksRelativeToRoot}`);
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
