#!/usr/bin/env node
'use strict';

const run = require('./run');

const [script] = (process.argv[2] || '').split('/');
const args = process.argv.slice(3);

process.env.CI = true;
process.env.NODE_ENV = 'production';

let scriptFile;
try {
	scriptFile = require.resolve('./tasks/' + script);
	if (!scriptFile) {
		throw new Error('Not found');
	}
} catch (e) {
	console.log('Unknown task "' + script + '".');
	process.exit(1);
}


run(scriptFile, args);
