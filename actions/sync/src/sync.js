'use strict';
const { basename, dirname, join } = require('path');
const { promises: fs, existsSync } = require('fs');

const { context } = require('@actions/github');

const { exec } = require('./exec');

Object.assign(exports, {
	sync,
	hasChanges,
});

let FILES_TO_SYNC = null;

async function listChangedFiles(dir) {
	const { before: from } = context.payload || {};
	const to = context.sha;
	const command = from
		? `git diff --name-only ${from} ${to}`
		: 'git diff-tree --no-commit-id --name-only -r HEAD';
	console.log('DIFF:', command);
	const files = await exec(dir, command);
	return files
		.trim()
		.split('\n')
		.map(x => join(dir, x));
}

async function listDirectory(dir) {
	const out = [];
	for (let file of await fs.readdir(dir)) {
		file = join(dir, file);
		const stat = await fs.stat(file);
		out.push(...(stat.isDirectory() ? await listDirectory(file) : [file]));
	}

	return out;
}

async function hasChanges() {
	return getSources('has-changes');
}

async function computeDiff() {
	const cwd = process.cwd();
	const get = x => `${cwd}/packages/scripts-${x}/config/init-files/`;
	const [changes, lib, app, cmp] = await Promise.all([
		context.eventName === 'push' && listChangedFiles(cwd),
		listDirectory(get('lib')),
		listDirectory(get('app')),
		listDirectory(get('cmp')),
	]);

	console.log(
		changes
			? `Changed files to sync:\t\n${changes.join('\t\n')}`
			: 'All files will be synchronized.'
	);
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
		'app-scripts': [...lib, ...app].reduce(toMap, {}),
		'cmp-scripts': [...lib, ...cmp].reduce(toMap, {}),
	};

	return {
		...groups,
		'has-changes': changed,
	};
}

async function getSources(script) {
	if (!FILES_TO_SYNC) {
		FILES_TO_SYNC = computeDiff();
	}

	return {
		[script]: {},
		...(await FILES_TO_SYNC),
	}[script];
}

async function resolve(dir) {
	try {
		const {
			scripts: { test },
		} = require(dir + '/package.json');
		// console.log(dir);
		const [script] = test.split(' ');
		return script;
	} catch {
		/**/
	}
	return null;
}

async function sync(dir) {
	const script = await resolve(dir);
	if (!script) {
		console.warn(
			'"%s" does not appear to use our templates. Skipping.',
			basename(dir)
		);
		return;
	}
	const targets = Object.entries(await getSources(script));

	if (targets.length === 0) {
		console.debug(`${basename(dir)}: No changes`);
		return;
	}

	// ensure target directories exist
	await Promise.allSettled(
		targets.map(([t]) =>
			exec(dir, ['mkdir', '-p', dirname(join(dir, t))].join(' '))
		)
	);

	await Promise.allSettled(
		targets.map(([t, src]) => {
			const dest = join(dir, t);
			return exec(
				dir,
				existsSync(src) ? `cp ${src} ${dest}` : `rm -f ${dest}`
			);
		})
	);

	for (let [f] of targets) {
		await exec(dir, 'git add -f ' + f);
	}

	const diff = (await exec(dir, 'git diff --staged')).trim();
	if (!diff) {
		console.debug(`${basename(dir)}: No changes`);
		return;
	}

	console.log('Updated: ', dir);
	console.log(
		await exec(
			dir,
			[
				'git commit -m ":wrench: Synchronize project files from updated templates"',
				// 'git show HEAD',
				'git push',
			].join(';')
		)
	);
}
