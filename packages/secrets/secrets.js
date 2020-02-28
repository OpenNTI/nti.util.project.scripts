#!/usr/bin/env node
'use strict';
const all = require('./gather');
const deleteSecret = require('./del');
const setSecret = require('./set');

const common = y => y
	.option('all')
	.option('repo', {
		describe: 'explicity set github repo name (otherwise infer from current directory) Ignored if --all is set.',
		type: 'string'
	})
	.positional('name', { describe: 'name of secret', type: 'string', default: 'actions_repo_access' });


require('yargs')

	.command('set <value> [name]', 'set a secret',
		y => common(y)
			.positional('value', { describe: 'value of secret', type: 'string' }),

		async ({ name, value, repo, ...opts }) => {
			if (opts.all) {
				await all(r => setSecret(name, value, r));
			} else {
				await setSecret(name, value, repo);
			}
		}
	)

	.command('del <name>', 'drop a secret', common,
		async ({ name, repo, ...opts }) => {
			if (opts.all) {
				await all(r => deleteSecret(name, r));
			} else {
				await deleteSecret(name, repo);
			}
		}
	)

	.help('help')
	.argv;
