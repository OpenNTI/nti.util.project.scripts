#!/usr/bin/env node
'use strict';
const { spawn } = require('child_process');
const path = require('path');

const chalk = require('chalk');

const [, file, ...argv] = process.argv;
const script = path.basename(file);
const args = argv.length ? ['--', ...argv] : [];

const write = (x) => console.log(x);

const pkg = require(`${process.cwd()}/package.json`);
const name = pkg.name;
const scripts = pkg.scripts || {};

if (!scripts[script]) {
	write(chalk.red(`\n\nThis project (${chalk.underline(chalk.bold(name))}) does not define the "${chalk.underline(chalk.bold(script))}" script.\n\n`));
	process.exit(1);
}

spawn('npm', ['run', script, ...args], { stdio: 'inherit' });
