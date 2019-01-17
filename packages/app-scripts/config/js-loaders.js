'use strict';
const path = require('path');

const eslintFormatter = require('react-dev-utils/eslintFormatter');

const cache = require('./cache');
const {PROD} = require('./env');
const paths = require('./paths');
const workspaceLinks = require('./workspace-links');

const jsTestExp = /\.m?jsx?$/;

const standardPreloaderEntries = [
	cache(),
	!PROD && {
		// First, run the linter.
		// It's important to do this before Babel processes the JS.
		loader: require.resolve('eslint-loader'),
		options: {
			// We can't lock the config until we can delete the web-app's legacy directory
			//
			// useEslintrc: false,
			// baseConfig: {
			// 	extends: [require.resolve('./eslintrc')]
			// },
			emitWarning: false,
			eslintPath: require.resolve('eslint'),
			failOnError: true,
			failOnWarning: false,
			formatter: eslintFormatter,
			ignore: false,
		}
	}
];

const preloaders = () => [
	{
		test: jsTestExp,
		enforce: 'pre',
		include: [
			path.join(paths.nodeModules, '@nti'),
		],
		use: [
			...standardPreloaderEntries,
			{
				loader: require.resolve('@nti/baggage-loader'),
				options: {
					'[file].css': {},
					'index.generated.css': {}
				}
			},
		].filter(Boolean)
	},
	{
		// legacy baggage-load; remove once we've weaned ourselves off of sass
		test: jsTestExp,
		enforce: 'pre',
		include: [
			paths.src,
			//Only lint|baggage source files in workspaceLinks
			...(Object.values(workspaceLinks()).map(x => path.join(x, 'src')))
		],
		use: [
			...standardPreloaderEntries,
			{
				loader: require.resolve('@nti/baggage-loader'),
				options: {
					'[file].scss': {}
				}
			},
		].filter(Boolean)
	}
];

const loaders = () => [
	{
		test: jsTestExp,
		exclude: [/[/\\\\]core-js[/\\\\]/, /[/\\\\]@babel[/\\\\]/],
		use: [
			cache(),
			{
				loader: require.resolve('thread-loader'),
				options: PROD ? {} : {
					poolTimeout: Infinity, // keep workers alive for more effective watch mode
				},
			},
			{
				loader: require.resolve('babel-loader'),
				options: {
					babelrc: false,
					compact: false,
					cacheDirectory: false,
					cacheCompression: false,
					highlightCode: true,
					sourceType: 'unambiguous',
					presets: [
						require.resolve('./babel.config.js'),
						PROD && [require.resolve('babel-preset-minify'), {
							builtIns: false,
							mangle: false,
							deadcode: false,
							simplify: false,
							evaluate: false,
							consecutiveAdds: false
						}]
					].filter(Boolean)
				}
			},
		].filter(Boolean)
	},

];

module.exports = {
	loaders,
	preloaders
};
