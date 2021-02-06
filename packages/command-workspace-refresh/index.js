#!/usr/bin/env node
import {execSync} from 'child_process';
import {promises as fs} from 'fs';
import {resolve} from 'path';
import {promisify} from 'util';
import glob from 'glob';
import ora from 'ora';

const find = promisify(glob);

async function clean () {
	const candidates = await find('**/node_modules');
	const moduleDirs = candidates.filter((x, i, a) => !a.slice(0,i).find(y => x.startsWith(y)));
	return Promise.all(moduleDirs.map(x =>
		// remove the node_modules
		fs.rm(x, {force: true, recursive:true})))
}


(async function main () {
	const spinner = ora('Cleaning...').start();
	await clean();
	spinner.stop();

	execSync('npm install', {
		cwd: resolve('.'),
		stdio: 'inherit'
	});
})();
