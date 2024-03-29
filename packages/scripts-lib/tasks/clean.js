'use strict';
const chalk = require('chalk');
const fs = require('fs-extra');

const { resolveApp, src, path: root } = require('../config/paths');

const write = x => console.log(chalk.cyan('\n' + x));
const dirs = [
	resolveApp('dist'),
	resolveApp('docs'),
	resolveApp('lib'),
	resolveApp('reports'),
]
	.reduce((a, x) => (a.includes(x) ? a : [...a, x]), [])
	.filter(
		x => x && x.startsWith(root) && !x.startsWith(src) && fs.existsSync(x)
	);

if (dirs.length) {
	write(
		`Cleanup: removing output dirs: ${dirs
			.map(x => chalk.magenta(x))
			.join(', ')}`
	);
	for (let dir of dirs) {
		fs.removeSync(dir);
	}

	write('Done.');
} else {
	write('Nothing to do.');
}
