'use strict';
const DEBUG = process.argv.includes('--debug') || process.argv.includes('--profile');

const path = require('path');
const autoprefixer = require('autoprefixer');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
//
const eslintFormatter = require('react-dev-utils/eslintFormatter');

const paths = require('./paths');
const pkg = require(paths.packageJson);

const ENV = process.env.NODE_ENV || 'development';
const PROD = ENV === 'production';

const browsers = require('@nti/lib-scripts/config/browserlist');
const getWorkspace = require('@nti/lib-scripts/config/workspace');
const workspaceLinks = (!PROD && paths.workspace)
	? getWorkspace(paths.workspace, paths.packageJson)
	: {};

exports = module.exports = {
	mode: ENV,
	bail: PROD,
	entry: {
		index: path.resolve(paths.src, 'index.js')
	},
	output: {
		path: path.join(paths.path, path.dirname(pkg.main)),
		filename: path.basename(pkg.main),
		library: pkg.name,
		libraryTarget: 'commonjs-module',
		pathinfo: !PROD,
		devtoolModuleFilenameTemplate: info =>
			path.resolve(info.absoluteResourcePath)
				.replace(path.resolve(paths.path), paths.servedPath)
				.replace('src/main', '')
				.replace(/\\/g, '/')
				.replace(/\/\//g, '/')
	},

	devtool: PROD ? 'source-map' : 'cheap-module-source-map',

	node: {
		crypto: 'empty',
	},


	target: 'web',

	resolve: {
		modules: [
			paths.nodeModules,
			'node_modules',//needed for conflicted versions of modules that get nested, but attempt last.
		],
		extensions: ['.js', '.jsx', '.mjs', '.mjsx'],
		alias: {
			...workspaceLinks,
			// Resolve Babel runtime relative to app-scripts.
			// It usually still works on npm 3 without this but it would be
			// unfortunate to rely on, as app-scripts could be symlinked,
			// and thus babel-runtime might not be resolvable from the source.
			'@babel/runtime': path.dirname(
				require.resolve('@babel/runtime/package.json')
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
			if (/^[@a-z\-0-9]+/i.test(request)) {
				return callback(null, 'commonjs ' + request);
			}
			callback();
		}
	],

	module: {
		strictExportPresence: true,
		rules: [
			// Disable require.ensure as it's not a standard language feature.
			{ parser: { requireEnsure: false } },

			{
				test: /\.m?jsx?$/,
				enforce: 'pre',
				use: [
					// First, run the linter.
					// It's important to do this before Babel processes the JS.
					!PROD && {
						loader: require.resolve('eslint-loader'),
						options: {
							useEslintrc: false,
							baseConfig: {
								extends: [require.resolve('./eslintrc')]
							},
							emitWarning: false,
							eslintPath: require.resolve('eslint'),
							failOnError: true,
							failOnWarning: false,
							formatter: eslintFormatter,
							ignore: false,
						},
					},
					{
						loader: require.resolve('@nti/baggage-loader'),
						options: {
							'[file].scss':{},
							'[file].css':{}
						}
					},
				].filter(Boolean),
				include: [
					paths.src,
					//Only lint|baggage source files in workspaceLinks
					...(Object.values(workspaceLinks).map(x => path.join(x, 'src')))
				],
				exclude: [/[/\\\\]node_modules[/\\\\]/],
			},

			{
				oneOf: [
					{
						test: /\.m?jsx?$/,
						exclude: [/[/\\\\]core-js[/\\\\]/, /[/\\\\]@babel[/\\\\]/],
						use: [
							!PROD && {
								loader: 'cache-loader',
								options: {
									cacheDirectory: path.resolve(paths.path, 'node_modules/.cache/nti-build')
								}
							},
							{
								loader: require.resolve('babel-loader'),
								options: {
									babelrc: false,
									cacheDirectory: !PROD,
									presets: [require.resolve('./babel.config.js')]
								}
							},
						]
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
						test: /\.(ico|gif|png|jpg|svg)(\?.*)?$/,
						exclude: [/-avatar.png$/, /\.template\.svg$/],
						loader: require.resolve('url-loader'),
						options: {
							limit: 50,
							name: 'assets/[name]-[hash].[ext]',
							mimeType: 'image/[ext]'
						}
					},

					{
						test: /\.(woff|ttf|eot|otf)(\?.*)?$/,
						loader: require.resolve('file-loader'),
						options: {
							name: 'assets/fonts/[hash].[ext]'
						}
					},

					{
						test: /\.(eot|ttf|woff)$/,
						loader: require.resolve('file-loader'),
						query: {
							name: 'assets/fonts/[name]-[hash].[ext]'
						}
					},

					{
						test: /\.(s?)css$/,
						use: [
							!PROD ? 'style-loader' : MiniCssExtractPlugin.loader,
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
										autoprefixer({ browsers })
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
					}
				].filter(Boolean)
			}
		].filter(Boolean)
	},

	optimization: {
		minimize: false
	},

	performance: {
		hints: false,
		// maxEntrypointSize: 250000, //bytes
		// maxAssetSize: 250000, //bytes
	},

	plugins: [
		DEBUG && new CircularDependencyPlugin({
			// exclude detection of files based on a RegExp
			exclude: /node_modules/,

			// add errors to webpack instead of warnings
			// failOnError: true,

			onDetected ({ /*module,*/ paths: cycle, compilation }) {
				// `paths` will be an Array of the relative module paths that make up the cycle
				// `module` will be the module record generated by webpack that caused the cycle
				compilation.warnings.push(new Error(cycle.join('\n\t-> ')));
			}
		}),

		PROD && new MiniCssExtractPlugin({
			filename: '[name].css'
		}),

		// Watcher doesn't work well if you mistype casing in a path so we use
		// a plugin that prints an error when you attempt to do this.
		// See https://github.com/facebookincubator/create-react-app/issues/240
		new CaseSensitivePathsPlugin(),
	].filter(Boolean)
};
