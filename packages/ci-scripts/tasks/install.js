'use strict';
const { lockfileExists, call, printLine } = require('./util');

const SUCCESS = 0;

const options = {
	forgive: true,
	env: {
		// NPM will not install devDependencies if NODE_ENV is set to production.
		// We use devDependencies to declare our build tool chain. We require devDependencies to build.
		// So override the env here.
		NODE_ENV: 'development'
	}
};

printLine('Installing dependencies ... ');
const {status:result} = call(`npm ${!lockfileExists() ? 'i' : 'ci'} --no-progress`, options);
if (result === SUCCESS) {
	printLine('done.');
	reportInstalled();
} else {
	printLine('failed!');
	process.exit(result);
}



function reportInstalled () {
	const {stdout} = call('npm list --long --parseable', {...options, fd: 'pipe'});
	const data = stdout.toString('utf8');
	const parsed = data.split(/[\r\n]+/).map(x => {
		const [path, name] = x.split(':');
		return (!x) ? null : {
			name,
			path: path.replace(process.cwd(), '.')
		};
	})
		.filter(Boolean)
		.sort((a, b) => a.name.localeCompare(b.name));

	const nameColWidth = parsed.reduce((max, {name}) => Math.max(max, name.length), 0) + 2;

	printLine('Packages Installed:');

	for (let {name, path} of parsed) {
		const spaces = new Array(nameColWidth - name.length).join(' ');
		printLine(`${name}${spaces}${path}`);
	}

	printLine('-- End of Installed Packages --');
}
