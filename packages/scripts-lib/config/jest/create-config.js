'use strict';
const fs = require('fs');
const path = require('path');
const { isCI } = require('ci-info');
const { defaults } = require('jest-config');

//get the 'active' paths
const setupEnv = require('./setup-env');
const {
	config: configDir,
	setupFiles: extSetupFiles,
	setupFilesAfterEnv: extSetupFilesAfterEnv,
} = setupEnv();
const paths = require(path.resolve(configDir, './paths'));
const { testEnvironment } = require(paths.packageJson);

module.exports = resolve => {
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
		...defaults,
		clearMocks: true,
		resetMocks: true,
		// resetModules: true, //Can't enable this, ExtJS code breaks
		collectCoverageFrom: [
			'src/**/*.{js,jsx,mjs}',
			'!**/*.spec.js',
			'!**/__test__/**',
		],
		coverageDirectory: 'reports/coverage',
		coverageReporters: ['text-summary', 'lcov', 'cobertura'],
		moduleDirectories: ['node_modules'],
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
		rootDir: paths.path,
		roots: ['<rootDir>'],
		globalSetup: resolve('config/jest/global-setup.js'),
		setupFiles,
		setupFilesAfterEnv,
		testPathIgnorePatterns: [
			'<rootDir>[/\\\\](build|docs|node_modules|scripts)[/\\\\]',
		],
		testEnvironment: testEnvironment || process.env.JEST_ENV || 'node',
		testURL: 'http://localhost',
		moduleFileExtensions: [
			...defaults.moduleFileExtensions,
			'js',
			'mjs',
			'ts',
			'tsx',
		],
		transformIgnorePatterns: [],
		transform: {
			'\\.[jt]sx?$': resolve('config/jest/babelTransform.js'),
			'\\.s?[ac]ss$': resolve('config/jest/cssTransform.js'),
			'\\.(csv|ico|gif|png|jpg|svg|woff|ttf|eot|otf)$': resolve(
				'config/jest/fileTransform.js'
			),
		},
		moduleNameMapper: {
			// Strip query-strings from import paths
			'(.*)\\?(.*)$': '$1',
		},
		// verbose: true,
		bail: true,
	};

	return config;
};
