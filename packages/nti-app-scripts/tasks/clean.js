'use strict';
const chalk = require('chalk');
const fs = require('fs-extra');

const {resolveApp} = require('../config/paths');

const outputs = [
	resolveApp('dist'),
	resolveApp('reports')
];

const write = x => console.log(chalk.cyan('\n' + x));
const dirs = outputs
	.reduce((a, x) => a.includes(x) ? a : [...a, x], [])
	.filter(fs.existsSync);

if (dirs.length) {
	write(`Cleanup: removing output dirs: ${dirs.map(x => chalk.magenta(x)).join(', ')}`);
	for (let dir of dirs) {
		fs.removeSync(dir);
	}


	write('Done.');
}
