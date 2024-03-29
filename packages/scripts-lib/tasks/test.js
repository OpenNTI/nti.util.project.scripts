'use strict';
//Inspired by "react-scripts"
const { spawnSync } = require('child_process');
const { cpus } = require('os');
const path = require('path');

const fs = require('fs-extra');
const { isCI } = require('ci-info');
const paths = require('../config/paths');

const isDebugFlag = RegExp.prototype.test.bind(/inspect/i);
const isDebug = Boolean(process.argv.find(isDebugFlag));

const config = [
	paths.resolveApp('jest.config.cjs'),
	paths.resolveApp('jest.config.js'),
];
if (!config.some(x => fs.existsSync(x))) {
	fs.copySync(
		paths.resolveOwn('config/init-files/jest.config.cjs'),
		config[0]
	);
}

process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';
process.env.PUBLIC_URL = '';

if (paths.package.type === 'module') {
	process.stdout.write('\nVerifying import integrity...');
	const result = spawnSync('node', ['-e', "import('./src/index.js')"], {
		env: process.env,
		stdio: 'pipe',
	});

	if (result.status) {
		process.stdout.write('failed.\n\n');
		process.stderr.write('Import Error details:\n\n');
		process.stderr.write(result.stderr?.toString('utf8'));
		process.stderr.write('\n\n');
		process.exit(result.status);
	}
	process.stdout.write('passed.\n\n');
}

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

if (!isDebug && !argv.includes('--runInBand')) {
	argv.push('--maxWorkers=' + cpus().length);
}

if (isDebug) {
	argv.push('--runInBand');
}

require('jest').run(argv.filter(x => !isDebugFlag(x)));
