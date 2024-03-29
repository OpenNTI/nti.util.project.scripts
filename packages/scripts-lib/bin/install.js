'use strict';
const { homedir } = require('os');
const { execSync } = require('child_process');
const { isCI } = require('ci-info');
const {
	existsSync,
	unlink,
	appendFileSync,
	readFileSync,
	writeFileSync,
	chmodSync,
} = require('fs');
const { join, relative } = require('path');
const { format } = require('util');
const { listProjects } = require('./list');
require('./validate-env.js');
const cwd = () => process.env.INIT_CWD ?? process.cwd();

const hooksDir = join(process.cwd(), 'hooks');

const logFile = join(homedir(), '.nti-install.log');
const log = existsSync(logFile)
	? msg => appendFileSync(logFile, msg + '\n')
	: x => console.log(x);

const exec = (x, work = cwd()) => (
	log(`exec <${work.replace(homedir(), '~')}> ${x}`),
	execSync(x, {
		cwd: work,
		env: process.env,
		stdio: 'pipe',
	})
		.toString('utf8')
		.trim()
);

process
	.on('unhandledRejection', reason => {
		log(`Unhandled Rejection at Promise: ${format('%j', reason)}`);
		process.exit(1);
	})
	.on('uncaughtException', err => {
		log(`Uncaught Exception thrown: ${format('%j', err)}`);
		process.exit(1);
	});

function usesScripts(dir) {
	try {
		const {
			name,
			dependencies = {},
			devDependencies = {},
		} = JSON.parse(readFileSync(join(dir, 'package.json')));
		const scripts = [
			'@nti/app-scripts',
			'@nti/cmp-scripts',
			'@nti/lib-scripts',
		];

		return (
			name === '@nti/project-scripts' ||
			scripts.some(x => x in dependencies || x in devDependencies)
		);
	} catch {
		// if package.json doesn't exist the answer is false.
	}
	return false;
}

function remove(file) {
	if (existsSync(file)) {
		unlink(file);
		log(`Removed: ${file}`);
	}
}

function save(file, content) {
	writeFileSync(file, content);
}

async function install(root = cwd(), leaf = false) {
	if (isCI || /\/\.npm|tmp\//.test(hooksDir)) {
		log(`Ignored install: ${process.env.INIT_CWD}`);
		return;
	}

	if (!leaf) {
		log(
			`New install:\n\tINIT_CWD: ${
				process.env.INIT_CWD
			}\n\tCWD:      ${process.cwd()}\n\tHOOK_DIR: ${hooksDir}`
		);
	}

	if (leaf && !usesScripts(root)) {
		log('Ignored, path does not use nti scripts: ' + root);
		return;
	}

	const execInRoot = cmd => exec(cmd, root);
	const resolveGitHooksPrefix = () =>
		join(execInRoot('git rev-parse --show-toplevel'), '.git', 'hooks');
	const hooksRelativeToRoot = relative(root, hooksDir);

	try {
		try {
			const gitHooksPrefix = resolveGitHooksPrefix();
			const oldHooks = [
				join(gitHooksPrefix, 'pre-commit'),
				join(gitHooksPrefix, 'prepare-commit-msg'),
			];

			for (const file of oldHooks) {
				remove(file);
			}
		} catch {
			/**/
		}

		// This will fail when we are in a workspace (the root will not be a prefix of the hooks directory)
		const result = execInRoot('husky install ' + hooksRelativeToRoot);
		// Husky does not output anything on some failures?
		if (/(not a Git repository)|(not allowed)|(^$)/.test(result)) {
			throw new Error('install workspace');
		}
		log(`husky install results: "${result}"`);
	} catch (e) {
		if (/(.git can't be found)|(not allowed)|(install workspace)/.test(e)) {
			if (root === cwd() && !leaf) {
				log(`Workspace detected (${root})`);
				return Promise.all(
					(await listProjects(root)).map(x => install(x, true))
				);
			}

			if (leaf) {
				log(`Setting hooks dir for ${root} to ${hooksRelativeToRoot}`);
				const target = join(resolveGitHooksPrefix(), 'pre-commit');
				save(
					target,
					`#!/usr/bin/env bash
					echo "Unsupported GIT client. The git client must support core.hooksPath."
					exit 1
					`.replace(/^\s+/gim, '')
				);
				chmodSync(target, '755');
				return execInRoot(
					`git config core.hooksPath ${hooksRelativeToRoot}`
				);
			}
		}

		throw e;
	} finally {
		try {
			// If in a git repo, get the configured hooks dir (will throw if not a git repo)
			const p = execInRoot('git config core.hooksPath');
			if (p) {
				// Throw an error if the path 'p' is not tracked
				execInRoot('git ls-files --error-unmatch ' + p);
				// If we didn't throw, then the file is tracked and we are
				// in the project-scripts project, remove the hook.
				execInRoot('git config --unset core.hooksPath');
				remove(join(resolveGitHooksPrefix(), 'pre-commit'));
			}
		} catch {
			// If it throws, we are good... if it doesn't then we cleaned up.
		}
	}
}

install().catch(x => {
	console.error(x.stack || x);
	process.exitCode = 1;
});
