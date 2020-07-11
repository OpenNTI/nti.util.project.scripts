'use strict';
const {join} = require('path');
const {promises: fs} = require('fs');
const {exec} = require('../../../packages/lib-scripts/tasks/utils/call-cmd');

Object.assign(exports, {
	sync,
});

async function listDirectory (dir) {
	const out = [];
	for (let file of await fs.readdir(dir)) {
		file = join(dir,file);
		const stat = await fs.stat(file);
		out.push(...(stat.isDirectory() ? await listDirectory(file) : [file]));
	}

	return out;
}

async function getSources (script) {
	const cwd = process.cwd();
	const get = x => `${cwd}/packages/${x}-scripts/config/init-files/`;
	const [lib, app, cmp] = await Promise.all([
		listDirectory(get('lib')),
		listDirectory(get('app')),
		listDirectory(get('cmp')),
	]);

	const pattern = new RegExp(get('(lib|app|cmp)'));

	const toMap = (o, p) => {
		const key = p.replace(pattern, '').replace(/(.+)\.dotfile$/i, '.$1');
		o[key] = p;
		return o;
	};

	return {
		[script]: {},
		'lib-scripts': lib.reduce(toMap, {}),
		'app-scripts': [...lib,...app].reduce(toMap, {}),
		'cmp-scripts': [...lib,...cmp].reduce(toMap, {}),
	}[script];
}

async function resolve (dir) {
	try {
		const {scripts: {test}} = require(dir + '/package.json');
		// console.log(dir);
		const [script] = test.split(' ');
		return script;
	} catch {/**/}
	return null;
}

async function sync (dir) {
	const script = await resolve(dir);
	if (!script) {
		console.warn('"%s" does not appear to use our templates. Skipping.', dir);
		return;
	}
	const targets = await getSources(script);

	await Promise.all(Object.entries(targets)
		.map(([t,src]) => exec(dir, [
			'cp', src, join(dir,t)].join(' ')
		))
	);

	const diff = (await exec(dir, 'git diff')).trim();

	if (diff) {
		for (let f of Object.keys(targets)) {
			await exec(dir, 'git add -f ' + f);
		}

		console.log('Updated: ', dir);
		console.log(await exec(dir, [
			'git commit -m ":wrench: Synchronize project files from updated templates"',
			// 'git show HEAD',
			'git push'
		].join(';')));
	}
}
