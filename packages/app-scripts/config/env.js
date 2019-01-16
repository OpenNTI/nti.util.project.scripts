'use strict';

const DEVENV = 'development';
const ENV = process.env.NODE_ENV || DEVENV;
const PROD = ENV === 'production';

module.exports = {
	ENV,
	PROD
};
