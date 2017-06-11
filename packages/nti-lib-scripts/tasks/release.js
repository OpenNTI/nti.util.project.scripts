'use strict';
const chalk = require('chalk');
const gitState = require('git-state');
const semver = require('semver');
const paths = require('../config/paths');
const call = require('./utils/call-cmd');

const tasks = ['check', 'test'];
const DATE = new Date().toString();

const pkg = require(paths.packageJson);

const major = process.argv.includes('--major');

const write = (x) => console.log(x);

if (!gitState.isGitSync(paths.path)) {
	write('\n\n' + chalk.red(chalk.underline(paths.path) + ' is not a git repository.') + '\n\n');
	process.exit(1);
}


const {branch, dirty} = gitState.checkSync(paths.path);

const inc = branch === 'master' ? (major ? 'major' : 'minor') : 'patch';

if (major && branch !== 'master') {
	write('\n\n'
		+ chalk.red('You cannot release a major version increment while on branch: ' + chalk.underline(branch)
		+ '.\nYou must be on ' + chalk.underline('master')) + '\n\n');
	process.exit(1);
}

if (dirty) {
	write('\n\n' + chalk.red(chalk.underline(paths.path) + ' has uncommited changes.') + '\n\n');
	process.exit(1);
}

if (branch === 'master' && !/-alpha$/.test(pkg.version)) {
	write('\n\n' + chalk.red(chalk.underline(pkg.name + '@' + pkg.version) + ' should end in -alpha.') + '\n\n');
	process.exit(1);
}

write(chalk.cyan('Working on branch: ' + chalk.underline.magenta(branch)));

for (let task of tasks) {
	write(chalk.cyan('\nRunning: Task: ' + chalk.underline.magenta(task)));
	call('node', [require.resolve('./' + task)]);
}

const version = semver.inc(pkg.version, inc);
const newTag = `v${version}`;
const nextVersion = semver.inc(version, 'minor') + '-alpha';

// npm --no-git-tag-version version $VERSION > /dev/null
write(chalk.cyan(`\nSetting release version: ${chalk.underline.magenta(version)}...`));
call('npm', ['--no-git-tag-version', 'version', version], {stdio: null});

write(chalk.cyan(`\nCommiting release version ${chalk.underline.magenta(version)}, tagging...`));
// git add package.json package-lock.json
call('git', ['add', 'package.json', 'package-lock.json']);
// git commit -m "$VERSION" > /dev/null
call('git', ['commit', '-m', version]);
// git tag "v$VERSION" -m "Cut on $DATE"
call('git', ['tag', newTag, '-m', `Cut on ${DATE}`]);


if (branch === 'master') {
	write(chalk.cyan(`\nSetting up next release version: ${chalk.underline.magenta(nextVersion)}...`));
	// npm --no-git-tag-version version $VERSION > /dev/null
	call('npm', ['--no-git-tag-version', 'version', nextVersion], {stdio: null});

	// git add package.json package-lock.json
	call('git', ['add', 'package.json', 'package-lock.json']);
	// git commit -m "$VERSION" > /dev/null
	call('git', ['commit', '-m', nextVersion]);
}

write(chalk.cyan(`\n${chalk.underline('Pushing')} changes to remote...`));
call('git', ['push']);
call('git', ['push', 'tag', newTag]);


write('\n');
write(chalk.magenta('Done.\n\n'));
