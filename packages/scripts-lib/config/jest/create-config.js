'use strict';
const fs = require('fs');
const path = require('path');
const { isCI } = require('ci-info');

//get the 'active' paths
const setupEnv = require('./setup-env');
const {
	config: configDir,
	setupFiles: extSetupFiles,
	setupFilesAfterEnv: extSetupFilesAfterEnv,
} = setupEnv();
const paths = require(path.resolve(configDir, './paths'));
const getWorkspace = require('../workspace');
const { testEnvironment } = require(paths.packageJson);

const { aliases: workspaceLinks } = getWorkspace(paths.packageJson, {
	regexp: true,
});

module.exports = (resolve, rootDir) => {
	const setupTestsFile = fs.existsSync(paths.testsSetup)
		? paths.testsSetup
		: undefined;

	const setupFiles = [
		'raf/polyfill',
		resolve('config/polyfills.js'),
		...extSetupFiles,
	];

	const setupFilesAfterEnv = [
		resolve('config/jest/setup-after-env.js'),
		...extSetupFilesAfterEnv,
	];

	if (setupTestsFile) {
		setupFilesAfterEnv.push(setupTestsFile);
	}

	const scriptsPackageLocalSetup = path.join(configDir, 'jest-setup.js');
	if (fs.existsSync(scriptsPackageLocalSetup)) {
		setupFiles.push(scriptsPackageLocalSetup);
	}

	const config = {
		// clearMocks: true,
		// resetMocks: true,
		// resetModules: true, //Can't enable this, ExtJS code breaks
		collectCoverageFrom: [
			'src/**/*.{js,jsx,mjs}',
			'!**/*.spec.js',
			'!**/__test__/**',
		],
		coverageDirectory: 'reports/coverage',
		coverageReporters: ['text-summary', 'lcov', 'cobertura'],
		moduleDirectories: [
			paths.appModules &&
				paths.appModules.replace(paths.path, '<rootDir>'),
			'node_modules',
		].filter(Boolean),
		reporters: !isCI
			? void 0
			: [
					'default',
					[
						'jest-junit',
						{
							outputDirectory: 'reports/test-results',
							outputName: 'index.xml',
						},
					],
			  ],
		roots: [
			paths.appModules
				? paths.appModules.replace(paths.path, '<rootDir>')
				: '<rootDir>/src/',
		],
		globalSetup: resolve('config/jest/global-setup.js'),
		setupFiles,
		setupFilesAfterEnv,
		testPathIgnorePatterns: [
			'<rootDir>[/\\\\](build|docs|node_modules|scripts)[/\\\\]',
		],
		testEnvironment: testEnvironment || process.env.JEST_ENV || 'node',
		testURL: 'http://localhost',
		transform: {
			'^.+\\.(js|jsx|mjs)$': resolve('config/jest/babelTransform.js'),
			'^.+\\.(scss|css)$': resolve('config/jest/cssTransform.js'),
			'^(?!.*\\.(js|jsx|json|css|scss)$)': resolve(
				'config/jest/fileTransform.js'
			),
		},
		transformIgnorePatterns: [],
		moduleNameMapper: {
			...(isCI ? null : workspaceLinks),
		},
		resolver: resolve('config/jest/resolver.js'),
	};

	if (rootDir) {
		config.rootDir = rootDir;
	}

	return config;
};
