'use strict';
const fs = require('fs');

const paths = require('../../config/paths');

module.exports = (resolve, rootDir) => {

	const setupTestsFile = fs.existsSync(paths.testsSetup)
		? '<rootDir>/src/setupTests.js'
		: undefined;

	const config = {
		collectCoverageFrom: ['src/**/*.{js,jsx}','!**/*.spec.js'],
		coverageDirectory: 'reports/coverage',
		coverageReporters: [
			'text',
			'lcov',
			'cobertura'
		],
		roots: [
			'<rootDir>/src/'
		],
		setupFiles: [
			'babel-polyfill',
			resolve('config/polyfills.js')
		],
		setupTestFrameworkScriptFile: setupTestsFile,
		testPathIgnorePatterns: [
			'<rootDir>[/\\\\](build|docs|node_modules|scripts)[/\\\\]',
		],
		testEnvironment: 'node',
		testResultsProcessor: './node_modules/jest-junit',
		testURL: 'http://localhost',
		transform: {
			'^.+\\.(js|jsx)$': resolve('config/jest/babelTransform.js'),
			'^.+\\.css$': resolve('config/jest/cssTransform.js'),
			'^(?!.*\\.(js|jsx|css|json)$)': resolve('config/jest/fileTransform.js'),
		},
		transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$'],
		moduleNameMapper: {},
	};

	if (rootDir) {
		config.rootDir = rootDir;
	}

	return config;
};
