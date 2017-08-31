'use strict';
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const {outputs} = require('../config/rollup');

const write = x => console.log(chalk.cyan('\n' + x));
const dirs = outputs.map(x => path.dirname(x.file))
	.reduce((a, x) => a.includes(x) ? a : [...a, x], [])
	.filter(fs.existsSync);

if (dirs.length) {
	write(`Cleanup: removing output dirs: ${dirs.map(x => chalk.magenta(x)).join(', ')}`);
	for (let dir of dirs) {
		fs.removeSync(dir);
	}


	write('Done.');
}
