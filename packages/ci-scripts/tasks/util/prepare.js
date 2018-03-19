'use strict';
const fs = require('fs-extra');
const path = require('path');
const {spawnSync} = require('child_process');

const call = (x, {fd = 'inherit', forgive = false} = {}) => {
	const [cmd, ...args] = x.split(' ');

	const {status} = spawnSync(cmd, args, {
		stdio: typeof fd === 'string'
			? fd
			: ['ignore', fd, fd]
	});

	if (typeof fd !== 'string') {
		fs.closeSync(fd);
	}

	if (status !== 0 && !forgive) {
		console.log('Command failed: ', x);
		process.exit(status);
	}

	return status;
};

const cwd = process.cwd();
const packageFile = path.join(cwd, 'package.json');
const lockfile = path.join(cwd, 'package-lock.json');
const modulesDir = path.join(cwd, 'node_modules');

Object.assign(exports,{
	printHeader,
	getPackageNameAndVersion,
	prepare,
	call,
	nofail: {fd: 'ignore', forgive: true},

	lockfile,
	modulesDir,
	packageFile,
});


function printHeader (...args) {
	const line = new Array(80).join('–');
	console.log('\n\n%s', line);

	const [fmt, ...values] = args;
	console.log(` ${fmt}`, ...values);

	console.log('%s\n\n', line);
}


function getPackageNameAndVersion () {
	const pkg = fs.readJsonSync(packageFile);
	const {name, version} = pkg;
	return {
		name, version, pkg
	};
}


function prepare (type) {
	const {name, version, pkg} = getPackageNameAndVersion();
	const [stamp] = new Date().toISOString().replace(/[-T:]/g, '').split('.');

	if (!/-alpha$/.test(version)) {
		console.log('Version %s, does not have an alpha tag. Aborting.', version);
		return process.exit(1);
	}

	//DATE=`date +%Y%m%d%H%M`
	printHeader('Preparing %s build %s@%s.%s', type, name, version, stamp);

	fs.remove(lockfile);
	fs.remove(modulesDir);

	// download latest deps (and alphas)
	fs.writeJsonSync(
		packageFile,
		(json => (
			[json.dependencies, json.devDependencies].forEach(deps =>
				deps && Object.keys(deps)
					.filter(x => x.startsWith('nti-'))
					.forEach(x => (o => o[x] = 'alpha')(deps))),
			json
		))(pkg),
		{spaces: 2}
	);

	const nodeEnv = process.env.NODE_ENV;
	process.env.NODE_ENV = ''; //NPM will not install devDependencies if NODE_ENV is set to production.

	const log = fs.openSync(path.join(cwd, '.node_modules.log'), 'w+');

	console.log('Installing dependencies...');
	call('npm install --parseable --no-progress', {fd:log});
	console.log('Dependencies installed.');

	process.env.NODE_ENV = nodeEnv;
	return {
		name, version, stamp
	};
}
