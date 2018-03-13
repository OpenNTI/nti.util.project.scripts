'use strict';
const path = require('path');
const paths = require('../paths');
const createJestConfig = require('./create-config');

module.exports = createJestConfig(
	relativePath => path.resolve(__dirname, '..', relativePath),
	path.resolve(paths.src, '..'),
	false
);
