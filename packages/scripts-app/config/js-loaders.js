'use strict';
const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');
const webpack = require('webpack');
const findCacheDir = require('find-cache-dir'); //a dep of babel-loader

const thread = require('./thread');
const {ENV, PROD} = require('./env');
const paths = require('./paths');
const workspaceLinks = require('./workspace-links');
const workspaceContext = path.dirname(paths.path);

const jsTestExp = /\.m?jsx?$/;

const loaders = (options = {}) => {
	const loader = require.resolve('babel-loader');
	const [root] = loader.split('node_modules');
	// use workspace root for cache, or fallback to default location
	const cacheDirectory = findCacheDir({ cwd: root, name: 'babel-loader' }) || true;

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
					loader,
					options: {
						babelrc: false,
						compact: false,
						cacheDirectory,
						cacheCompression: false,
						highlightCode: true,
						...(options.babel || {})
					}
				},
				{
					loader: 'astroturf/loader',
					options: {
						extension: '.module.css',
					},
				},
			].filter(Boolean)
		},
	];
};

const plugins = () => [
	!PROD && new ESLintPlugin({
		baseConfig: {
			root: true,
			extends: [require.resolve('./eslintrc')]
		},

		context: workspaceContext,
		files: [
			paths.src,
			...(Object.values(workspaceLinks()).map(x => path.join(x, 'src'))),
		].filter(Boolean)
			.map(x => path.relative(workspaceContext, x) + '/'),

		extensions: ['js', 'jsx', 'mjs', 'cjs'],

		eslintPath: require.resolve('eslint'),
		// failOnError: true,
		// failOnWarning: false,
		// formatter: eslintFormatter
	}),
	new webpack.DefinePlugin({
		'process.browser': JSON.stringify(true),
		'process.env.NODE_ENV': JSON.stringify(ENV),
	}),
	new webpack.ProvidePlugin({
		css: ['astroturf', 'css'],
		styled: ['astroturf', 'styled'],
	}),
];

module.exports = {
	loaders,
	pattern: jsTestExp,
	plugins,
};
