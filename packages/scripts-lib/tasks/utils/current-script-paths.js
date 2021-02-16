'use strict';
const path = require('path');

module.exports = require(path.resolve(
	path.dirname(process.argv[1]),
	'../config/paths'
));
