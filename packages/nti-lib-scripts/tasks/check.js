'use strict';

const spawn = require('cross-spawn');

const paths = require('../config/paths');

process.on('unhandledRejection', err => { throw err; });


const result = spawn.sync('eslint', ['--ext', '.js,.jsx', paths.src], { stdio: 'inherit' });
if (result.status) {
	process.exit(result.status);
}
