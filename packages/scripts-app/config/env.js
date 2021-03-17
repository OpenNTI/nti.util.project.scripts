'use strict';

const DEV_ENV = 'development';
const ENV = process.argv.includes('--dev-build')
	? DEV_ENV
	: process.env.NODE_ENV || DEV_ENV;
const PROD = ENV === 'production';

process.env.__IN_WEBPACK = true;

module.exports = {
	ENV,
	PROD,
};
