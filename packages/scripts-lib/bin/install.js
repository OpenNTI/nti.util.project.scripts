'use strict';
const { execSync } = require('child_process');
const { mkdir, readFile, writeFile } = require('fs').promises;
const { join, basename } = require('path');
require('./validate-env.js');

const cwd = () => process.env.INIT_CWD ?? process.cwd();
const exec = x => execSync(x, {cwd: cwd()}).toString('utf8').trim();

const hookSrc = [
	join(__dirname, 'pre-commit-hook.sh'),
	join(__dirname, 'prepare-commit-msg-hook.sh')
];

async function installHooks (basepath) {
	const [ , ...out] = await Promise.all([
		mkdir(basepath, {recursive: true}),
		...hookSrc.map(async x => ({
			dest: join(basepath, basename(x, '-hook.sh')),
			content: await readFile(x)
		}))
	]);

	await Promise.all(out.map(x =>
		writeFile(x.dest, x.content, {mode: 0o777})
	));
}


(async () => {
	let hooks;
	try {
		hooks = [
			join(exec('git rev-parse --show-toplevel'), '.git', 'hooks')
		];
	} catch {
		// not in a git repo
		hooks = [];
		console.log('Not GIT: %s\n%o', cwd(), process.argv);
	}

	await Promise.all(hooks.map(installHooks));

})().catch(x => console.error(x.stack || x));
