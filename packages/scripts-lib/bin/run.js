#!/usr/bin/env node
'use strict';
require('./set-app-dir');

const { spawn } = require('child_process');
const path = require('path');

const chalk = require('chalk');

const readPackageJson = require('../tasks/utils/read-package-json');

const [, file, ...argv] = process.argv;
const script = path.basename(file);
const args = argv.length ? ['--', ...argv] : [];

const write = (x) => console.log(x);

const {json: pkg} = readPackageJson();
const name = pkg.name;
const scripts = pkg.scripts || {};

if (!scripts[script]) {
	write(chalk.red(`\n\nThis project (${chalk.underline(chalk.bold(name))}) does not define the "${chalk.underline(chalk.bold(script))}" script.`));
	if (!pkg.scripts || !scripts.test || !scriptExists(script)) {
		write('\n\n');
		write(chalk.red('❌  Could not guess command.'));
		process.exit(1);
	}

	scripts[script] = scripts.test.replace(/test$/, script);
	write(chalk.red(`⚠️  Assuming: "${chalk.bold(scripts[script])}"... add to package to remove this warning.\n\n`));

	const [cmd, ...sargs] = scripts[script].split(/\s+/);

	args.unshift();//remove '--' since we aren't using NPM to run the script.

	spawn(cmd, [...sargs, ...args], { env: process.env, stdio: 'inherit' });
	process.exit();
}

spawn('npm', ['run', script, ...args], { env: process.env, stdio: 'inherit' });



function scriptExists (s) {
	try {
		if (!require.resolve('@nti/' + scripts.test.split(/\s+/)[0] + '/tasks/' + s)) {
			throw new Error('nope');
		}
	} catch (e) {
		return false;
	}

	return true;
}
