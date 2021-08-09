'use strict';
const path = require('path');
const { default: babelJest } = require('babel-jest');
const resolveScriptDir = require('../resolve-script-dir');
const paths = require('../paths');
const builtIn = path.join(resolveScriptDir(), 'config', 'babel.config.js');

module.exports = babelJest.createTransformer({
	configFile: false,
	presets: [paths.exists(paths.resolveApp('babel.config.cjs'), builtIn)],
});
