#!/usr/bin/env node
'use strict';
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

const paths = require('./utils/paths');
const call = require('./utils/call-cmd');

const write = x => console.log(chalk.cyan('\n' + x));

const usesLocks = /true/i.test(call('npm', ['config', 'get', 'package-lock'], {stdio: 'pipe'}));
if (usesLocks) {

	write('Updating lock file...');

	fs.removeSync(path.resolve(paths.path, 'package-lock.json'));
	fs.removeSync(path.resolve(paths.path, 'node_modules'));

	call('npm', ['install', '--no-progress']);
}
