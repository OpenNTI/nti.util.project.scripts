'use strict';
const path = require('path');
const createJestConfig = require('./create-config');

module.exports = createJestConfig(relativePath =>
	path.resolve(__dirname, '../..', relativePath)
);
