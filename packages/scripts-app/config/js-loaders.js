'use strict';
const path = require('path');
const webpack = require('webpack');

const { ESLintPlugin } = require('./webpack.plugins');
const { ENV, PROD } = require('./env');
const paths = require('./paths');
const getWorkspace = require('./workspace');
const workspaceContext = getWorkspace().root || paths.path;

const jsTestExp = /\.m?jsx?$/;

const loaders = (buildCache = false) => {
	return [
		{
			[Symbol.for('JS Rule')]: true,
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
						babelrc: false, // FIXME: I don't think this is used with `configFile: false`
						cacheDirectory: false,
						cacheCompression: false,
						configFile: false,
						highlightCode: true,
						sourceType: 'unambiguous',
						presets: [require.resolve('./babel.config.js')],
						plugins: [
							// WebKit started treating object-shorthand properties as implicit strict-mode-ish scope.
							// This avoids it by transforming all object shorthand to long-hand.
							'@babel/plugin-transform-shorthand-properties',
						],
					},
				},
				{
					loader: 'astroturf/loader',
					options: {
						allowGlobal: true,
						useAltLoader: buildCache,
					},
				},
			].filter(Boolean),
		},
	];
};

const plugins = () => [
	new webpack.ProvidePlugin({
		css: ['astroturf/react', 'css'],
		styled: ['astroturf/react', 'default'],
		stylesheet: ['astroturf/react', 'stylesheet'],
	}),

	!PROD &&
		new ESLintPlugin({
			// Do NOT define a baseConfig, let eslint find the config in scope
			// otherwise we can end up redefining plugins and eslint will now
			// blow up if that happens. To prevent this, we either need to
			// centralize the config so its located only in one place (ie:
			// npm 7 workspaces) Or let it find the local config. (which is
			// what this is now doing at the moment)

			context: workspaceContext,
			files: [
				paths.src,
				...(getWorkspace().projects || []).map(x =>
					path.join(x, 'src')
				),
			]
				.filter(Boolean)
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
];

module.exports = {
	loaders,
	pattern: jsTestExp,
	plugins,
};
