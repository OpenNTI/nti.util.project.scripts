'use strict';
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const readline = require('readline');
const {spawnSync} = require('child_process');

const call = (x, {env = {}, fd = 'inherit', forgive = false} = {}) => {
	const [cmd, ...args] = x.split(' ');
	const {signal, status} = spawnSync(cmd, args, {
		env: {...process.env, ...env},
		stdio: typeof fd === 'string'
			? fd
			: ['ignore', fd, fd]
	});

	if (typeof fd !== 'string') {
		fs.closeSync(fd);
	}

	if (signal) {
		print('Command killed: ', x);
		process.kill(process.pid, signal);
		process.exit(status);
	}
	else if (status !== 0 && !forgive) {
		print('Command failed: ', x);
		process.exit(status);
	}

	return status;
};

const cwd = process.cwd();
const packageFile = path.join(cwd, 'package.json');
const lockfile = path.join(cwd, 'package-lock.json');
const modulesDir = path.join(cwd, 'node_modules');

Object.assign(exports,{
	print,
	reprint,
	printHeader,
	getPackageNameAndVersion,
	call,
	nofail: {fd: 'ignore', forgive: true},

	lockfile,
	modulesDir,
	packageFile,
});


function print (...args) {
	console.log(
		util.formatWithOptions({ colors: true }, ...args)
	);
}


function reprint (...args) {
	readline.moveCursor(process.stdout, 0, -1);
	print(...args);
}


function printHeader (...args) {
	const line = new Array(80).join('–');
	print('\n\n%s', line);

	const [fmt, ...values] = args;
	print(` ${fmt}`, ...values);
	print('%s\n\n', line);

	call('npm config list');
	print('\n\n%s\n\n', line);
}


function getPackageNameAndVersion () {
	const pkg = fs.readJsonSync(packageFile);
	const {name, version} = pkg;
	return {
		// semver: MAJOR.MINOR.PATCH-PRERELEASETAG.PRERELEASEITERATION
		// If the version has a hyphen, then its a snapshot.
		isSnapshot: /-/.test(version),
		name, version, pkg
	};
}
