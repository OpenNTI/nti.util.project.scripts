'use strict';
const {join} = require('path');
const {promises: fs} = require('fs');

const {context} = require('@actions/github');

const {exec} = require('../../../packages/scripts-lib/tasks/utils/call-cmd');

Object.assign(exports, {
	sync,
	hasChanges,
});

let FILES_TO_SYNC = null;

async function listChangedFiles  (dir) {
	const {before: from} = context.event || {};
	const to = context.sha;
	const command = from ? `git diff --name-only ${from} ${to}` : 'git diff-tree --no-commit-id --name-only -r HEAD';
	const files = await exec(dir, command);
	return files.trim().split('\n').map(x => join(dir, x));
}

async function listDirectory (dir) {
	const out = [];
	for (let file of await fs.readdir(dir)) {
		file = join(dir,file);
		const stat = await fs.stat(file);
		out.push(...(stat.isDirectory() ? await listDirectory(file) : [file]));
	}

	return out;
}

async function hasChanges () {
	return getSources('has-changes');
}

async function computeDiff () {
	const cwd = process.cwd();
	const get = x => `${cwd}/packages/scripts-${x}/config/init-files/`;
	const [changes, lib, app, cmp] = await Promise.all([
		context.eventName === 'push' && listChangedFiles(cwd),
		listDirectory(get('lib')),
		listDirectory(get('app')),
		listDirectory(get('cmp')),
	]);

console.log(changes);
	const pattern = new RegExp(get('(lib|app|cmp)'));

	let changed = false;
	const toMap = (o, p) => {
		const key = p.replace(pattern, '').replace(/(.+)\.dotfile$/i, '.$1');
		if (!changes || changes.includes(p)) {
			changed = true;
			o[key] = p;
		}
		return o;
	};

	const groups = {
		'lib-scripts': lib.reduce(toMap, {}),
		'app-scripts': [...lib,...app].reduce(toMap, {}),
		'cmp-scripts': [...lib,...cmp].reduce(toMap, {}),
	};

	return {
		...groups,
		'has-changes': changed,
	};
}

async function getSources (script) {
	if (!FILES_TO_SYNC) {
		FILES_TO_SYNC = computeDiff();
	}

	return {
		[script]: {},
		...(await FILES_TO_SYNC),
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
	const targets = Object.entries(await getSources(script));

	if (targets.length === 0) {
		console.debug('No changes');
		return;
	}

	await Promise.all(targets
		.map(([t,src]) => exec(dir, [
			'cp', src, join(dir,t)].join(' ')
		))
	);

	const diff = (await exec(dir, 'git diff')).trim();

	if (!diff) {
		console.debug('No changes');
		return;
	}

	for (let [f] of targets) {
		await exec(dir, 'git add -f ' + f);
	}

	console.log('Updated: ', dir);
	console.log(await exec(dir, [
		'git commit -m ":wrench: Synchronize project files from updated templates"',
		// 'git show HEAD',
		'git push'
	].join(';')));
}