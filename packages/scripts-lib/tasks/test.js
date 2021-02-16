'use strict';
//Inspired by "react-scripts"
const path = require('path');
const fs = require('fs-extra');
const jest = require('jest');
const { isCI } = require('ci-info');
const paths = require('../config/paths');

const isDebugFlag = RegExp.prototype.test.bind(/inspect/i);
const isDebug = Boolean(process.argv.find(isDebugFlag));

const config = paths.resolveApp('jest.config.js');
if (!fs.existsSync(config)) {
	fs.copySync(paths.resolveOwn('config/init-files/jest.config.js'), config);
}

process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';
process.env.PUBLIC_URL = '';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
	throw err;
});

const isTestTask =
	path.basename(process.argv[1]) === path.basename(module.filename);

const argv = isTestTask ? process.argv.slice(2) : [];

//CI needs coverage
if (isCI && !argv.includes('--coverage')) {
	argv.push('--coverage');
}

if (!isDebug) {
	argv.push('--maxWorkers=4');
}

if (isDebug) {
	argv.push('--runInBand');
}

jest.run(argv.filter(x => !isDebugFlag(x)));
