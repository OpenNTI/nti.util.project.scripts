'use strict';
const {spawnSync} = require('child_process');
const {join} = require('path');
const paths = require('../config/paths');

const args = process.argv.slice(2);

if (process.argv[1] === module.filename) {
	process.argv[1] = require.resolve('@nti/lib-scripts/tasks/check');
}

require('@nti/lib-scripts/tasks/check');

process.on('unhandledRejection', err => { throw err; });

if (process.env.CI) {
	args.unshift('--formatter=compact');
}

spawnSync('stylelint', [
	join(paths.src,	'**/*.{scss,css}'),
	...args
], {
	env: process.env,
	stdio: 'inherit'
});
