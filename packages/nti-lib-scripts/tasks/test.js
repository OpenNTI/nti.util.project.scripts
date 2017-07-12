'use strict';
//Inspired by "react-scripts"
const path = require('path');

const jest = require('jest');

const paths = require('../config/paths');

const createJestConfig = require('./utils/create-jest-config');

process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';
process.env.PUBLIC_URL = '';
process.env.JEST_JUNIT_OUTPUT = 'reports/test-results/index.xml';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => { throw err; });

const isTestTask = process.argv[1] === module.filename;

const argv = isTestTask ? process.argv.slice(2) : [];

//CI needs coverage
if (process.env.CI && !argv.includes('--coverage')) {
	argv.push('--coverage');
}


argv.push(
	'--config',
	JSON.stringify(
		createJestConfig(
			relativePath => path.resolve(__dirname, '..', relativePath),
			path.resolve(paths.src, '..'),
			false
		)
	)
);

jest.run(argv);
