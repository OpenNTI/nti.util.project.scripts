'use strict';
const chalk = require('chalk');
const inquirer = require('inquirer');
const {spawnSync} = require('child_process');
const semver = require('semver');


const getMaintBranchName = (v) => (v = semver.parse(v), v && (v.patch = '', `maint-${v.format().replace(/\.$/, '')}`));
const normalizeVersion = x => (x = semver.parse(x), x && x.format());

const write = (x) => console.log(x);
const call = (cmd, ...args) => spawnSync(cmd, args, {
	cwd: '/Users/jgrimes/Workspace/nti-web-app',
	env: Object.assign({}, process.env),
	stdio: [null, 'pipe', null],
	maxBuffer: 1024 * 1024 //1MB max
});


const version = normalizeVersion(process.argv[2]);
// write(`Arg: ${version}`);

const {stdout: tags} = call('git', 'tag');

if (!tags) {
	process.exit(1);
}


const list = Object.values(
	tags.toString('utf8')
		.split(/[\r\n]+/)
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

const questions = [
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
				name: `Checkout/create ${chalk.red(x.maint)}`,
				value: x,
			}
		))
	},
];



inquirer.prompt(questions)
	.then(handleResponse)
	.catch(e => {
		write('\n\nOuch... \n',e.stack || e);
	});


function handleResponse ({fix}) {

	write(fix);
}

//call('git', ['checkout', version]);
//call('git', ['checkout', '-b', `maint-${baseVersion}`]);
