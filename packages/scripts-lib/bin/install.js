'use strict';
const { execSync } = require('child_process');
const { mkdir, readFile, writeFile } = require('fs').promises;
const { join, basename } = require('path');
require('./validate-env.js');

const exec = x => execSync(x).toString('utf8').trim();

const hooks = join(exec('git rev-parse --show-toplevel'), '.git', 'hooks');
const hookSrc = [
	join(__dirname, 'pre-commit-hook.sh'),
	join(__dirname, 'prepare-commit-msg-hook.sh')
];

(async () => {
	const [ , ...out] = await Promise.all([
		mkdir(hooks, {recursive: true}),
		...hookSrc.map(async x => ({
			dest: join(hooks, basename(x, '-hook.sh')),
			content: await readFile(x)
		}))
	]);

	await Promise.all(out.map(x =>
		writeFile(x.dest, x.content, {mode: 0o777})
	));

})().catch(x => console.error(x.stack || x));
