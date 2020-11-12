#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import ora from 'ora';

import { getRepositories } from './lib/list.js';
import { clone } from './lib/workflow.js';

const options = yargs(hideBin(process.argv))
	.usage('Usage: $0 [options]')
	.option('user', {
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
	.conflicts('user', 'org')
	.conflicts('user', 'team')
	.help('h')
	.alias('h', 'help')
	.strict()
	.argv;


const spinner = ora('Starting...').start();
Promise.resolve()
	.then(getRepositories)
	.then(existing => {
		spinner.stop();
		return clone({...options, existing});
	})
	.catch(e => {
		console.error('\n\nOuch... \n',e.stack || e);
	});

