'use strict';
const fs = require('fs-extra');
const path = require('path');
const {spawnSync} = require('child_process');

const call = (x, {fd = 'inherit', forgive = false}) => {
	const [cmd, ...args] = x.split(' ');

	const {status} = spawnSync(cmd, args, {
		stdio: typeof fd === 'string'
			? fd
			: [process.stdin, fd, process.stderr]
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
const skipFile = path.join(cwd, '.snapshot-skip-npm');
const modulesDir = path.join(cwd, 'node_modules');

Object.assign(exports,{
	prepare,
	call,
	nofail: {fd: 'ignore', forgive: true},

	lockfile,
	modulesDir,
	packageFile,
});

function prepare () {
	const pkg = fs.readJsonSync(packageFile);
	const {name, version} = pkg;
	const [stamp] = new Date().toISOString().replace(/[-T:]/g, '').split('.');

	if (!/-alpha$/.test(version)) {
		console.log('Version %s, does not have an alpha tag. Aborting.', version);
		return process.exit(1);
	}

	//DATE=`date +%Y%m%d%H%M`
	console.log('Preparing build %s@%s.%s', name, version, stamp);

	if (!fs.existsSync(skipFile) || !fs.existsSync(modulesDir)) {
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

		fs.remove(lockfile);
		fs.remove(modulesDir);

		const log = fs.openSync(path.join(cwd, '.node_modules.log'), 'w+');
		call('npm install --parseable', {fd:log});
	}

	if (fs.existsSync(modulesDir)) {
		fs.utimesSync(modulesDir, new Date(), new Date());
	}

	return {
		name, version, stamp
	};
}
