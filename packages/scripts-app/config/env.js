'use strict';

const DEVENV = 'development';
const ENV = process.env.NODE_ENV || DEVENV;
const PROD = ENV === 'production';

process.env.__IN_WEBPACK = true;

module.exports = {
	ENV,
	PROD
};
