'use strict';
const path = require('path');

const chalk = require('chalk');
const fs = require('fs-extra');
const rollup = require('rollup');

const call = require('./utils/call-cmd');
const paths = require('../config/paths');
const {outputs, config} = require('../config/rollup');

process.on('unhandledRejection', err => {
	if (err.message === 'Warnings or errors were found') {
		console.log(chalk.red(err.message));
	} else {
		console.error(chalk.red(err.stack));
	}
	process.exit(1);
});


call('node', [require.resolve('./check')]);
call('node', [require.resolve('./test')]);

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
					sourceMap: true,
					exports: 'named'
				})
			)))
	.then(() => console.log(chalk.green('\nDone.\n\n')));
