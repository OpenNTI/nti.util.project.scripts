#!/usr/bin/env node
'use strict';
const fs = require('fs');
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


const data = process.stdin.isTTY ? null : fs.readFileSync(0, 'utf-8');

require('yargs')
	.command(`set${data ? '' : ' <value>'} [name]`, 'set a secret',
		y => data
			? common(y)
			: common(y)
				.positional('value', { describe: 'value of secret', type: 'string' }),

		async ({ name, value = data, repo, all }) => {
			if (all) {
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

