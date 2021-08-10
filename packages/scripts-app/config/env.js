'use strict';

const DEV_ENV = 'development';
const ENV = process.argv.includes('--dev-build')
	? DEV_ENV
	: process.env.NODE_ENV || DEV_ENV;
const PROD = ENV === 'production';

const DEBUG =
	process.argv.includes('--debug') || process.argv.includes('--profile');
const LINT = !PROD && !process.argv.includes('--dev-build');
const MINIFY =
	!DEBUG && !global.NTI_DevServer && !process.argv.includes('--dev-build');

process.env.__IN_WEBPACK = true;

module.exports = {
	DEBUG,
	ENV,
	PROD,
	LINT,
	MINIFY,
};
