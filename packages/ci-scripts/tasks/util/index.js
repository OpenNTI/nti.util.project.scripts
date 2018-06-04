'use strict';
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const {spawnSync} = require('child_process');

const call = (x, {env = {}, fd = 'inherit', forgive = false} = {}) => {
	const [cmd, ...args] = x.split(' ');
	const {signal, status, stdout, stderr} = spawnSync(cmd, args, {
		env: {...process.env, ...env},
		maxBuffer: 2 * 1024 * 1024,
		stdio: typeof fd === 'string'
			? (fd === 'ignore' ? 'pipe' : fd)
			: ['ignore', fd, fd]
	});

	if (typeof fd !== 'string') {
		fs.closeSync(fd);
	}

	if (signal) {
		printLine('Command killed: ', x);
		process.kill(process.pid, signal);
		process.exit(status);
	}
	else if (status !== 0 && !forgive) {
		printLine('Command failed: ', x);
		printLine(`${stderr}\n${stdout}`);
		process.exit(status);
	}

	return {status, stdout, stderr};
};

const cwd = process.cwd();
const packageFile = path.join(cwd, 'package.json');
const lockfile = path.join(cwd, 'package-lock.json');
const modulesDir = path.join(cwd, 'node_modules');

Object.assign(exports,{
	print,
	printLine,
	printHeader,
	getPackageNameAndVersion,
	call,
	nofail: {fd: 'ignore', forgive: true},

	lockfile,
	modulesDir,
	packageFile,
});


function printLine (...args) {
	return print(...args, '\n');
}

function print (...args) {
	const {stdout} = process;
	return stdout.write(
		util.formatWithOptions
			? util.formatWithOptions({ colors: true }, ...args)
			: util.format(...args)
	);
}


function printHeader (...args) {
	const line = new Array(80).join('–');
	printLine('\n\n%s', line);

	const [fmt, ...values] = args;
	printLine(` ${fmt}`, ...values);
	printLine('%s\n\n', line);

	call('npm config list');
	printLine('\n\n%s\n\n', line);
}


function getPackageNameAndVersion () {
	const pkg = fs.readJsonSync(packageFile);
	const {name, version, publishConfig} = pkg;
	return {
		// semver: MAJOR.MINOR.PATCH-PRERELEASETAG.PRERELEASEITERATION
		// If the version has a hyphen, then its a snapshot.
		isSnapshot: /-/.test(version),
		name, version, pkg,
		publishConfig
	};
}
