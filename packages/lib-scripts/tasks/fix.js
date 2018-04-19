'use strict';
const chalk = require('chalk');
const inquirer = require('inquirer');
const {spawnSync} = require('child_process');
const semver = require('semver');
const gitState = require('git-state');

const cwd = process.cwd();

const getMaintBranchName = (v) => (v = semver.parse(v), v && (v.patch = '', `maint-${v.format().replace(/\.$/, '')}`));
const normalizeVersion = x => (x = semver.parse(x), x && x.format());

const write = (...x) => console.log(...x);
const toList = (x) => x && x.stdout && x.stdout.toString('utf8').split(/[\r\n]+/).filter(Boolean);
const call = (cmd, ...args) => spawnSync(cmd, args, {
	cwd,
	env: Object.assign({}, process.env),
	stdio: [null, 'pipe', null],
	maxBuffer: 1024 * 1024 //1MB max
});


if (!gitState.isGitSync(cwd)) {
	write('\n\n' + chalk.red(chalk.underline(cwd) + ' is not a git repository.') + '\n\n');
	process.exit(1);
}

//Always work with current data...
call('git', 'fetch');


const {dirty} = gitState.checkSync(cwd);

if (dirty) {
	write('\n\n' + chalk.red(chalk.underline(cwd) + ' has uncommited changes.') + '\n\n');
	process.exit(1);
}



const version = normalizeVersion(process.argv[2]);
// write(`Arg: ${version}`);

const tags = toList(call('git', 'tag'));
const remotes = toList(call('git', 'remote'));
const branches = toList(call('git', 'branch', '-a')).map(x => x.replace(/^[*\s]+/, ''));

if (!remotes.includes('origin')) {
	write('This git repository does not have a remote named "origin"');
	process.exit(1);
}

if (!tags) {
	process.exit(1);
}

const list = Object.values(
	tags
		.filter(semver.valid)
		.sort(semver.compare)
		.map(x => ({
			tag: x,
			maint: getMaintBranchName(x),
			version: semver.parse(x).format()
		}))
		.reduce((_, x) => (_[x.maint] = x, _), {})
)
	.reverse()
	.filter(x => !version || x.maint === getMaintBranchName(version))
	.slice(0, 5);

inquirer.prompt([
	{
		type: 'list',
		name: 'fix',
		prefix: '',
		suffix: '',
		message: '\n\nWhat do you want to fix?',
		default: list[0],
		when: list.length > 1,
		choices: list.slice(0, 10).map(x => (
			{
				name: `Checkout/create ${chalk.red(x.maint)} branch`,
				short: x.maint,
				value: x,
			}
		))
	},
])
	.then(handleResponse)
	.catch(e => {
		write('\n\nOuch... \n',e.stack || e);
	});


function handleResponse ({fix = list[0]}) {
	// const call = write;
	const {tag, maint} = fix;
	const maintRemote = `remotes/origin/${maint}`;
	const remoteBranch = branches.find(x => x === maintRemote);
	const localBranch = branches.find(x => x === maint);


	// write(`remote branch: ${remoteBranch}`);
	// write(`local branch: ${localBranch}`);


	if (localBranch) {
		write(chalk.cyan('Exiting local branch detected, checking out...'));
		call('git', 'checkout', localBranch);

		if (remoteBranch) {
			write(chalk.cyan('Pulling from remote...'));
			call('git', 'pull', '-r');
		}

	} else {
		write(chalk.cyan(`Creating a new local branch starting at: ${chalk.underline.magenta(tag)}`));
		call('git', 'checkout', tag);
		call('git', 'checkout', '-b', maint);

		if (!remoteBranch) {
			write(chalk.cyan('No remote branch detected, pushing new branch to remote...'));
			call('git', 'push', '-u', 'origin', maint);
		} else {
			write(chalk.cyan('Exiting remote branch detected, pulling from remote...'));
			call('git', 'branch', '--set-upstream-to=origin/' + maint, maint);
			call('git', 'pull', '-r');
		}
	}

	write('\n');
	write(chalk.cyan('😎 You should now be on branch: ' + chalk.underline.magenta(maint)));
	write(chalk.cyan('🎉 Happy bug fixing! 🐛'));
	write('\n\n');
	write(chalk.cyan(`When you are ready to release a patch simply run: ${chalk.bold('release')} from this branch. (yes, its a command 😀)`));
	write('\n\n');
}
