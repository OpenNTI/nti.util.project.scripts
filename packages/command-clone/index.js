#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import ora from 'ora';

import { getRepositories } from './lib/list.js';
import { clone } from './lib/workflow.js';
import { exec } from './lib/exec.js';

const escapeJoin = (prefix, current) => {
	return (
		(prefix ? `${prefix}|` : '') +
		current.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
	);
};

const WEBAPP_REPOSITORY_NAMESPACES = new RegExp(
	`^nti\\.(${[
		'docs',
		'lib',
		'style',
		'web',
		'util',
		// 'content.landingpage',
	].reduce(escapeJoin, null)})\\..+`,
	'i'
);

const PRESETS = {
	webapp: {
		all: true,
		user: null,
		org: 'NextThought',
		team: 'WebApp-Platform',
		filter(repo) {
			if (repo.full_name in PRESETS.webapp.aliases) {
				return true;
			}

			return (
				WEBAPP_REPOSITORY_NAMESPACES.test(repo.name) &&
				!/(ou(bound|regents))|(web\.widget)/i.test(repo.name)
			);
		},
		aliases: {
			'NextThought/nti.web.app': 'app/webapp',
			'NextThought/nti.web.mobile': 'app/mobile',
			'NextThought/nti.web.login': 'app/login',
			'NextThought/nti.web.environments': 'app/environments',
			'NextThought/nti.web.service': 'app/service',
			'NextThought/nti.dataserver.docker': 'server',
			'NextThought/nti.util.project.scripts': 'scripts',
			'NextThought/foundation-sites-fork': 'forks/foundation-sites',
			'NextThought/react-sticky': 'forks/react-sticky',
			'NextThought/git-state': 'forks/git-state',
		},
	},
};

const options = yargs(hideBin(process.argv))
	.usage('Usage: $0 [options]')
	.option('user', {
		group: 'Selection:',
		conflicts: ['org', 'team'],
		describe: 'Scope to the current user',
		type: 'boolean',
	})
	.option('org', {
		group: 'Selection:',
		describe: 'Scope to an org',
		type: 'string',
	})
	.option('team', {
		group: 'Selection:',
		describe: 'Scope to a team in org',
		type: 'string',
	})
	.option('protocol', {
		describe: 'Set preferred clone protocol',
		choices: [
			'https',
			'ssh',
			// 'git'
		],
	})
	.option('all', {
		group: 'Selection:',
		describe: 'auto select all repositories',
		type: 'boolean',
	})
	.option('nest', {
		default: true,
		describe: 'nest repositories into prefix folders',
		type: 'boolean',
	})
	.option('preset', {
		group: 'Selection:',
		conflicts: ['all', 'org', 'team', 'user'],
		describe: '---',
		choices: ['webapp'],
	})
	.option('workspace', {
		group: 'Workspace:',
		describe:
			'Build a vscode workspace file (defaults to the listed variant)',
		type: 'boolean',
	})
	.option('workspace.listed', {
		group: 'Workspace:',
		description:
			'Build a vscode workspace file that lists each repository as a folder instead of rooting in the workspace.',
		type: 'boolean',
	})
	.option('workspace.nested', {
		group: 'Workspace:',
		description:
			'Build a vscode workspace file with the workspace root as the main entry exposing the directory structure.',
		type: 'boolean',
	})
	.option('git', {
		group: 'Workspace:',
		describe:
			'Experimental: Initialize a git repository and add all projects as submodules.',
		type: 'boolean',
	})
	.wrap(process.stdout.columns)
	.help('h')
	.alias('h', 'help')
	.strict().argv;

if (options.preset && PRESETS[options.preset]) {
	Object.assign(options, PRESETS[options.preset]);
}

(async () => {
	const spinner = ora('Starting...').start();
	try {
		const existing = await getRepositories(options);
		spinner.stop();

		if (options.git) {
			await exec('.', 'git init');
			if (options.protocol === 'git') {
				delete options.protocol;
			}
			await exec('.', 'git submodule init');

			if (!existing.includes(process.cwd())) {
				existing.unshift(process.cwd());
			}
		}
		await clone({ ...options, existing });

		if (options.git) {
			await exec('.', 'git add . -f');
			await exec('.', 'git commit -m "Initial clone"');
		}

		if (options.workspace) {
			console.log(
				`
			Your workspace is ready to install. From here, run: npm install

			If you have a local buildout of the dataserver, or do not want
			to run the container build step, set environment variable
			NTI_SKIP_DOCKER to any non-empty value.
			`.replace(/\t/g, '')
			);
		}
	} catch (e) {
		console.error('\n\nOuch... \n', e.stack || e);
	}
})();
