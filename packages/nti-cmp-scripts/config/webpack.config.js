/*eslint import/no-extraneous-dependencies: 0*/
'use strict';
const DEBUG = process.argv.includes('--debug') || process.argv.includes('--profile');

const path = require('path');
const autoprefixer = require('autoprefixer');
const webpack = require('webpack');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const eslintFormatter = require('react-dev-utils/eslintFormatter');

const paths = require('./paths');
const pkg = require(paths.packageJson);

const ENV = process.env.NODE_ENV || 'development';
const PROD = ENV === 'production';


exports = module.exports = {
	entry: {
		index: path.resolve(paths.src, 'index.js')
	},
	output: {
		path: path.join(paths.path, path.dirname(pkg.main)),
		filename: path.basename(pkg.main),
		library: pkg.name,
		libraryTarget: 'commonjs-module'
	},

	devtool: PROD ? 'source-map' : 'cheap-module-source-map',

	node: {
		crypto: 'empty',
		global: false,
	},


	target: 'web',

	resolve: {
		modules: [
			'node_modules',
			paths.nodeModules,
		],
		extensions: ['.jsx', '.js'],
		alias: {
			// Resolve Babel runtime relative to app-scripts.
			// It usually still works on npm 3 without this but it would be
			// unfortunate to rely on, as app-scripts could be symlinked,
			// and thus babel-runtime might not be resolvable from the source.
			'babel-runtime': path.dirname(
				require.resolve('babel-runtime/package.json')
			),

			'core-js':path.dirname(
				require.resolve('core-js/package.json')
			),

			// Support React Native Web
			// https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
			'react-native': 'react-native-web',
		},
	},


	externals: [
		// Every non-relative module is external
		// abc -> require("abc")
		(context, request, callback) => {
			if (/^[a-z\-0-9]+/i.test(request)) {
				return callback(null, 'commonjs ' + request);
			}
			callback();
		}
	],

	module: {
		strictExportPresence: true,
		rules: [
			{
				test: /\.jsx?$/,
				enforce: 'pre',
				use : [
					{
						loader: require.resolve('baggage-loader'),
						options: {
							'[file].scss':{}
						}
					},
					// First, run the linter. (loaders are run "bottom up")
					// It's important to do this before Babel processes the JS.
					{
						options: {
							formatter: eslintFormatter,
							ignore: false,
							failOnError: true,
							failOnWarning: false,
							emitWarning: false
						},
						loader: require.resolve('eslint-loader'),
					},
				],
				include: paths.src,
			},

			{
				test: /\.jsx?$/,
				enforce: 'pre',
				loader: require.resolve('source-map-loader')
			},

			{
				test: /\.jsx?$/,
				include: [paths.src],
				loader: require.resolve('babel-loader')
			},

			{
				test: /-avatar.png$/,
				loader: require.resolve('url-loader'),
				options: {
					mimeType: 'image/[ext]'
				}
			},

			{
				test: /\.template\.svg$/,
				loader: require.resolve('raw-loader')
			},

			{
				test: /\.(ico|gif|png|jpg|svg)$/,
				exclude: [/-avatar.png$/, /\.template\.svg$/],
				loader: require.resolve('url-loader'),
				options: {
					limit: 500,
					name: 'assets/[name]-[hash].[ext]',
					mimeType: 'image/[ext]'
				}
			},

			{
				test: /\.(s?)css$/,
				use: ExtractTextPlugin.extract({
					fallback: require.resolve('style-loader'),
					use: [
						{
							loader: require.resolve('css-loader'),
							options: {
								sourceMap: true
							}
						},
						{
							loader: require.resolve('postcss-loader'),
							options: {
								sourceMap: true,
								plugins: () => [
									autoprefixer({ browsers: ['> 1% in US', 'last 2 versions', 'iOS > 8'] })
								]
							}
						},
						{
							loader: require.resolve('resolve-url-loader')
						},
						{
							loader: require.resolve('sass-loader'),
							options: {
								sourceMap: true
							}
						}
					]
				})
			}
		]
	},

	plugins: [
		new webpack.AutomaticPrefetchPlugin(),

		DEBUG && new CircularDependencyPlugin({
			// exclude detection of files based on a RegExp
			exclude: /node_modules/,
			// add errors to webpack instead of warnings
			// failOnError: true
		}),

		webpack.optimize.ModuleConcatenationPlugin && new webpack.optimize.ModuleConcatenationPlugin(),

		new ExtractTextPlugin({
			filename: 'index.css',
			allChunks: true,
			disable: false
		}),
	].filter(x => x)
};
