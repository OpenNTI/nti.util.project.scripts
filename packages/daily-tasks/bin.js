#!/usr/bin/env node
'use strict';
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

const paths = require('./utils/paths');
const call = require('./utils/call-cmd');

const write = x => console.log(chalk.cyan('\n' + x));
const now = new Date();

function updateNodeModules () {
	const packageLockPath = path.resolve(paths.path, 'package-lock.json');
	const nodeModulesPath = path.resolve(paths.path, 'node_modules');
	const lockStats = fs.statSync(packageLockPath);
	const lastMod = new Date(lockStats.mtime);

	write('\tUpdate node_modules and package-lock:');

	if (lastMod.getDate() !== now.getDate()) {
		write('\t\tpackage-lock is out of date, updating...')
		fs.removeSync(packageLockPath);
		fs.removeSync(nodeModulesPath);
		call('npm', ['install']);
		write('\t\tFinished. Check the changes to package-lock.json to see if they need to be committed.');
	} else {
		write('\t\tpackage-lock is up-to-date.');
		write('\t\tFinished.');
	}
}


write('Running Daily Tasks:');

updateNodeModules();
