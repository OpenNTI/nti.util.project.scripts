'use strict';
const paths = require('../config/paths');
const call = require('./utils/call-cmd');

process.on('unhandledRejection', err => { throw err; });

const args = process.argv.slice(2);

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.BABEL_ENV = process.env.BABEL_ENV || process.env.NODE_ENV;

call('eslint', [
	'--ext',
	'.js,.jsx',
	paths.src,
	...args
]);
