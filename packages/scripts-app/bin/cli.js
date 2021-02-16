#!/usr/bin/env node
'use strict';
require('@nti/lib-scripts/bin/validate-env');

const run = require('@nti/lib-scripts/bin/run-task');
const { name } = require('../package.json');
const script = process.argv[2];
const args = process.argv.slice(3);

let scriptFile;
try {
	scriptFile = require.resolve('../tasks/' + script);
	if (!scriptFile) {
		throw new Error('Not found');
	}
} catch (e) {
	console.log('Unknown task "' + script + '".');
	process.exit(1);
}

run(scriptFile, name, args);
