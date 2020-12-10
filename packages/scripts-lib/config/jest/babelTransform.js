'use strict';
const path = require('path');
const babelJest = require('babel-jest');
const resolveScriptDir = require('../resolve-script-dir');

module.exports = babelJest.createTransformer({
	configFile: false,
	presets: [path.join(resolveScriptDir(), 'config', 'babel.config.js')],
});
