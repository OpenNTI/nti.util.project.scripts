'use strict';
const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');
const webpack = require('webpack');

const {ENV, PROD} = require('./env');
const paths = require('./paths');
const workspaceLinks = require('./workspace-links');
const workspaceContext = path.dirname(paths.path);

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
				{
					loader: require.resolve('babel-loader'),
					options: {
						babelrc: false,
						cacheDirectory: false,
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
		// Do NOT define a baseConfig, let eslint find the config in scope
		// otherwise we can end up redefining plugins and eslint will now
		// blow up if that happens. To prevent this, we either need to
		// centralize the config so its located only in one place (ie:
		// npm 7 workspaces) Or let it find the local config. (which is
		// what this is now doing at the moment)

		context: workspaceContext,
		files: [
			paths.src,
			...(Object.values(workspaceLinks()).map(x => path.join(x, 'src'))),
		].filter(Boolean)
			.map(x => path.relative(workspaceContext, x) + '/'),

		extensions: ['js', 'jsx', 'mjs', 'cjs'],

		eslintPath: require.resolve('eslint'),
		threads: true,
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
