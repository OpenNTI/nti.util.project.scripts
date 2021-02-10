#!/usr/bin/env node
import * as childProcess from 'child_process';
import {promises as fs} from 'fs';
import {dirname, join, resolve} from 'path';
import {promisify} from 'util';
import glob from 'glob';
import ora from 'ora';

const find = promisify(glob);
// const skipClean = !~process.argv.findIndex(x => /skip-clean/i);

async function clean () {
	const tmpDir = join(process.cwd(), '.trash');

	const candidates = await find('**/node_modules');
	const moduleDirs = candidates.filter((x, i, a) => !a.slice(0,i).find(y => x.startsWith(y)));
	await Promise.all(moduleDirs.map(async x => {
		await fs.mkdir(tmpDir, {recursive: true});
		const trash = await fs.mkdtemp(join(tmpDir, 'trash-'));
		await fs.rename(resolve(x), join(trash, 'node_modules'));
	}));

	// Don't wait for this, let it run in the background
	fs.rm(tmpDir, {force: true, recursive:true})
		.catch(er =>
			console.warn('[warn] Could not remove ${trash}\n\tbecause: ', er.message));
}

async function update () {
	const candidates = await find('**/.git');
	const repos = candidates
		.filter((x, i, a) =>
			!x.includes('node_modules')
			&& !a.slice(0,i).find(y => x.startsWith(y)))
		.map(x => resolve(dirname(x)));

	await Promise.all(repos.map(repo =>
		exec(repo, 'git pull --rebase --autostash')
			.catch(er => console.warn('[warn] %s: %s', repo, er))
	));
}

(async function main () {

	const spinner = ora('Pulling & Cleaning...').start();
	try {
		await Promise.all([
			update(),
			clean()
		]);
		spinner.stop();
	} catch (e) {
		console.error('Could not fully clean node_modules: ', e.message);
		process.exit(1);
	}

	childProcess.execSync('npm install', {
		cwd: resolve('.'),
		stdio: 'inherit'
	});
})();



export async function exec (cwd, command) {
	return new Promise((fulfill, reject) => {
		childProcess.exec(command, {cwd}, (err, stdout, stderr) => {
			if (err) {
				console.error(stderr.toString('utf8'));
				return reject(err);
			}

			fulfill(stdout.toString('utf8').trim());
		});
	});
}
