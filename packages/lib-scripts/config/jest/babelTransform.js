'use strict';
const path = require('path');
const babelJest = require('babel-jest');
const resolveScriptDir = require('../resolve-script-dir');

module.exports = babelJest.createTransformer({
	presets: [path.join(resolveScriptDir(), 'config', 'babelrc.js')],
	babelrc: false,
});
