'use strict';
const path = require('path');
const eslintFormatter = require('react-dev-utils/eslintFormatter');

const thread = require('./thread');
const {PROD} = require('./env');
const paths = require('./paths');
const workspaceLinks = require('./workspace-links');

const jsTestExp = /\.m?jsx?$/;

// options is a mapping of loader => options for that loader, e.g. {eslint: {useEslintrc: false}}
const standardPreloaderEntries = (options = {}) => [
	!PROD && {
		// First, run the linter.
		// It's important to do this before Babel processes the JS.
		loader: require.resolve('eslint-loader'),
		options: {
			useEslintrc: false,
			baseConfig: {
				root: true,
				extends: [require.resolve('./eslintrc')]
			},
			cache: true,
			emitWarning: false,
			eslintPath: require.resolve('eslint'),
			failOnError: true,
			failOnWarning: false,
			formatter: eslintFormatter,
			ignore: false,
			...(options.eslint || {})
		}
	},

].filter(Boolean);

const preloaders = (options = {}) => [
	{
		test: jsTestExp,
		enforce: 'pre',
		include: [
			paths.src,
			paths.ntiModules,
			//Only lint source files in workspaceLinks
			...(Object.values(workspaceLinks()).map(x => path.join(x, 'src'))),
			...(options.include || options.includes || [])
		],
		exclude: [
			path.join(paths.src, 'main/js/legacy'),
			...(options.exclude || [])
		],
		use: standardPreloaderEntries(options)
	},
	// legacy lint
	{
		test: jsTestExp,
		enforce: 'pre',
		include: path.join(paths.src, 'main/js/legacy'),
		use: standardPreloaderEntries({
			...options,
			eslint: {
				...options.eslint,
				useEslintrc: true
			}
		})
	}
];


const loaders = (options = {}) => {

	return [
		{
			test: jsTestExp,
			exclude: [
				/[/\\\\]core-js[/\\\\]/,
				/[/\\\\]@babel[/\\\\]/,
				/[/\\\\]react(-dom)?[/\\\\]/,
			],
			use: [
				thread(options.thread),
				{
					loader: require.resolve('babel-loader'),
					options: {
						babelrc: false,
						compact: false,
						cacheDirectory: true,
						cacheCompression: false,
						highlightCode: true,
						...(options.babel || {})
					}
				},
			].filter(Boolean)
		},
	];
};

module.exports = {
	loaders,
	preloaders,
	pattern: jsTestExp
};
