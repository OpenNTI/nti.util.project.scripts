#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import ora from 'ora';

import { getRepositories } from './lib/list.js';
import { clone } from './lib/workflow.js';

const escapeJoin = (prefix, current) => {
	return (prefix ? `${prefix}|` : '') + current.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

const WEBAPP_REPOSITORY_NAMESPACES = new RegExp(`^nti\\.(${[
	'docs',
	'lib',
	'style',
	'web',
	'util',
	// 'content.landingpage',
	// 'config.unittesting',
].reduce(escapeJoin, null)})\\..+`, 'i');


const PRESETS = {
	webapp: {
		all: true,
		user: null,
		org: 'NextThought',
		team: 'WebApp-Platform',
		filter (repo) {
			if (repo.full_name in PRESETS.webapp.aliases) {
				return true;
			}

			return WEBAPP_REPOSITORY_NAMESPACES.test(repo.name)
				&& !/(ou(bound|regents))|(web\.widget)/i.test(repo.name);
		},
		aliases: {
			'NextThought/nti.web.app': 'app/webapp',
			'NextThought/nti.web.mobile': 'app/mobile',
			'NextThought/nti.web.login': 'app/login',
			'NextThought/nti.web.environments': 'app/environments',
			'NextThought/nti.dataserver.docker': 'server',
			'NextThought/nti.util.project.scripts':'project-scripts',
			'NextThought/react-sticky': 'forks/react-sticky',
			'NextThought/git-state': 'forks/git-state',
		}
	}
};

const options = yargs(hideBin(process.argv))
	.usage('Usage: $0 [options]')
	.option('user', {
		conflicts: ['org', 'team'],
		describe: 'Scope to the current user',
		type: 'boolean'
	})
	.option('org', {
		describe: 'Scope to an org',
		type: 'string'
	})
	.option('team', {
		describe: 'Scope to a team in org',
		type: 'string'
	})
	.option('protocol', {
		describe: 'Set preferred clone protocol',
		choices: ['https', 'ssh', 'git']
	})
	.option('all', {
		describe: 'auto select all repositories',
		type: 'boolean'
	})
	.option('nest', {
		describe: 'nest repositories into prefix folders',
		type: 'boolean'
	})
	.option('preset', {
		conflicts: [ 'all', 'org', 'team', 'user' ],
		describe: '---',
		choices: ['webapp']
	})
	.option('workspace', {
		describe: 'Build a vscode workspace file',
		type: 'boolean'
	})
	.help('h')
	.alias('h', 'help')
	.strict()
	.argv;

if (options.preset && PRESETS[options.preset]) {
	Object.assign(options, PRESETS[options.preset]);
}

const spinner = ora('Starting...').start();
getRepositories(options)
	.then(existing => {
		spinner.stop();
		return clone({...options, existing});
	})
	.catch(e => {
		console.error('\n\nOuch... \n',e.stack || e);
	});

