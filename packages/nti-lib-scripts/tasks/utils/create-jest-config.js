'use strict';
const fs = require('fs');
const path = require('path');

//get the 'active' paths
const paths = require(path.resolve(path.dirname(process.argv[1]), '../config/paths'));
const {testEnvironment} = require(paths.packageJson);

module.exports = (resolve, rootDir) => {

	const setupTestsFile = fs.existsSync(paths.testsSetup)
		? '<rootDir>/src/__test__/setup.js'
		: undefined;

	const config = {
		collectCoverageFrom: ['src/**/*.{js,jsx}','!**/*.spec.js'],
		coverageDirectory: 'reports/coverage',
		coverageReporters: [
			'text',
			'lcov',
			'cobertura'
		],
		'moduleDirectories': [
			paths.appModules && paths.appModules.replace(paths.path, '<rootDir>'),
			'node_modules'
		].filter(Boolean),
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
		testEnvironment: testEnvironment || process.env.JEST_ENV || 'node',
		testResultsProcessor: process.env.CI ? './node_modules/jest-junit' : void 0,
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
