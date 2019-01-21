'use strict';
const path = require('path');

const eslintFormatter = require('react-dev-utils/eslintFormatter');

const cache = require('./cache');
const {PROD} = require('./env');
const paths = require('./paths');
const workspaceLinks = require('./workspace-links');

const jsTestExp = /\.m?jsx?$/;

// options is a mapping of loader => options for that loader, e.g. {eslint: {useEslintrc: false}}
const standardPreloaderEntries = (options = {}) => [
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
			...(options.eslint || {})
		}
	}
];

const preloaders = (options) => [
	{
		// legacy baggage-load; remove once we've weaned ourselves off of sass
		test: jsTestExp,
		enforce: 'pre',
		include: [
			paths.src,
			path.join(paths.nodeModules, '@nti'),
			//Only lint|baggage source files in workspaceLinks
			...(Object.values(workspaceLinks()).map(x => path.join(x, 'src'))),
			...(options || {}).includes
		],
		use: [
			...standardPreloaderEntries(options),
			{
				loader: require.resolve('@nti/baggage-loader'),
				options: {
					'[file].scss': {}
				}
			},
		].filter(Boolean)
	}
];

const loaders = (options = {}) => [
	{
		test: jsTestExp,
		exclude: [/[/\\\\]core-js[/\\\\]/, /[/\\\\]@babel[/\\\\]/],
		use: [
			cache(),
			{
				loader: require.resolve('thread-loader'),
				options: {
					...(PROD ? {} : {poolTimeout: Infinity}), // keep workers alive for more effective watch mode})
					...(options.thread || {})
				}
			},
			{
				loader: require.resolve('babel-loader'),
				options: {
					babelrc: false,
					compact: false,
					cacheDirectory: false,
					cacheCompression: false,
					highlightCode: true,
					...(options.babel || {})
				}
			},
		].filter(Boolean)
	},

];

module.exports = {
	loaders,
	preloaders,
	pattern: jsTestExp
};
