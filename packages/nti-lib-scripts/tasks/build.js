'use strict';
const path = require('path');

const chalk = require('chalk');
const spawn = require('cross-spawn');
const fs = require('fs-extra');
const rollup = require('rollup');

const paths = require('../config/paths');
const {outputs, config} = require('../config/rollup.config');

process.on('unhandledRejection', err => {
	if (err.message === 'Warnings or errors were found') {
		console.log(chalk.red(err.message));
	} else {
		console.error(chalk.red(err.stack));
	}
	process.exit(1);
});


const result = spawn.sync('node', [require.resolve('./test')], { stdio: 'inherit' });
if (result.status) {
	process.exit(result.status);
}

//Blank out lib
fs.emptyDirSync(path.resolve(paths.path, 'lib'));

rollup
	.rollup(config)
	.then(bundle =>
		Promise.all(
			outputs.map(o =>
				bundle.write({
					format: o.format,
					dest: o.dest,
					sourceMap: true
				})
			)))
	.then(() => console.log(chalk.green('\nDone.\n\n')));
