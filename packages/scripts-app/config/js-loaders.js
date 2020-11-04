'use strict';
const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');
const webpack = require('webpack');

const thread = require('./thread');
const {ENV, PROD} = require('./env');
const paths = require('./paths');
const workspaceLinks = require('./workspace-links');

const jsTestExp = /\.m?jsx?$/;

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

const plugins = () => [
	!PROD && new ESLintPlugin({
		baseConfig: {
			root: true,
			extends: [require.resolve('./eslintrc')]
		},

		context: paths.path,
		files: [
			paths.src,
			...(Object.values(workspaceLinks()).map(x => path.join(x, 'src'))),
		].filter(Boolean)
			.map(x => path.relative(paths.path, x) + '/'),

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
];

module.exports = {
	loaders,
	pattern: jsTestExp,
	plugins,
};
