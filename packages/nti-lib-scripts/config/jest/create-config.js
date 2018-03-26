'use strict';
const fs = require('fs');
const path = require('path');
const {isCI} = require('ci-info');

//get the 'active' paths
const paths = require(path.resolve(path.dirname(process.argv[1]), '../config/paths'));
const getWorkspace = require('../workspace');
const {testEnvironment} = require(paths.packageJson);


const DEV = !isCI;

const workspaceLinks = (DEV && paths.workspace)
	? getWorkspace(paths.workspace, paths.packageJson, {regexp: true})
	: {};

module.exports = (resolve, rootDir) => {

	const setupTestsFile = fs.existsSync(paths.testsSetup)
		? paths.testsSetup
		: undefined;

	const config = {
		// clearMocks: true,
		// resetMocks: true,
		// resetModules: true, //Can't enable this, ExtJS code breaks
		collectCoverageFrom: ['src/**/*.{js,jsx}','!**/*.spec.js'],
		coverageDirectory: 'reports/coverage',
		coverageReporters: [
			'text-summary',
			'lcov',
			'cobertura'
		],
		'moduleDirectories': [
			paths.appModules && paths.appModules.replace(paths.path, '<rootDir>'),
			'node_modules'
		].filter(Boolean),
		roots: [
			paths.appModules
				? paths.appModules.replace(paths.path, '<rootDir>')
				: '<rootDir>/src/'
		],
		setupFiles: [
			'babel-polyfill',
			'raf/polyfill',
			resolve('config/polyfills.js')
		],
		setupTestFrameworkScriptFile: setupTestsFile,
		testPathIgnorePatterns: [
			'<rootDir>[/\\\\](build|docs|node_modules|scripts)[/\\\\]',
		],
		testEnvironment: testEnvironment || process.env.JEST_ENV || 'node',
		testResultsProcessor: isCI ? './node_modules/jest-junit' : void 0,
		testURL: 'http://localhost',
		transform: {
			'^.+\\.(js|jsx|mjs)$': resolve('config/jest/babelTransform.js'),
			'^.+\\.css$': resolve('config/jest/cssTransform.js'),
			'^(?!.*\\.(js|jsx|css|json)$)': resolve('config/jest/fileTransform.js'),
		},
		transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$'],
		moduleNameMapper: {
			...workspaceLinks,
		},
	};

	if (rootDir) {
		config.rootDir = rootDir;
	}

	return config;
};
