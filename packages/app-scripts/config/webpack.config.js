'use strict';
const DEBUG = process.argv.includes('--debug') || process.argv.includes('--profile');

const path = require('path');
const autoprefixer = require('autoprefixer');
const webpack = require('webpack');
const tmp = require('tmp');
//Webpack plugins:
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const PreloadWebpackPlugin = require('preload-webpack-plugin');
//
const gitRevision = JSON.stringify(require('@nti/util-git-rev'));
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


function isNTIPackage (x) {
	const prefix = `${paths.nodeModules}/@nti/`;
	const decendent = /node_modules/;

	let str = x ? x.toString() : '';
	if(str.startsWith(prefix)) {
		str = str.substr(prefix.length);
		return !decendent.test(str);
	}
}


exports = module.exports = {
	mode: ENV,
	bail: PROD,
	entry: {
		index: [require.resolve('./polyfills'), paths.appIndexJs]
	},
	output: {
		path: paths.DIST_CLIENT,
		filename: 'js/[name]-[chunkhash:8].js',
		chunkFilename: 'js/[name].chunk.[chunkhash:8].js',
		pathinfo: !PROD,
		publicPath: paths.servedPath || '/',
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
		global: false,
	},


	target: 'web',

	resolve: {
		modules: [
			paths.nodeModules,
			paths.appModules,
			paths.resolveApp('src/main/resources/scss'),
			'node_modules',//needed for conflicted versions of modules that get nested, but attempt last.
		],
		extensions: ['.js', '.jsx', '.mjs', '.mjsx'],
		alias: {
			...workspaceLinks,
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
		{
			'extjs': 'Ext',
			'react' : 'React',
			'react-dom': 'ReactDOM'
		}
	],

	module: {
		strictExportPresence: true,
		rules: [
			// Disable require.ensure as it's not a standard language feature.
			// { parser: { requireEnsure: false } },

			// First, run the linter.
			// It's important to do this before Babel processes the JS.
			!PROD && {
				test: /\.m?jsx?$/,
				enforce: 'pre',
				use: [{
					loader: require.resolve('eslint-loader'),
					options: {
						formatter: eslintFormatter,
						ignore: false,
						failOnError: true,
						failOnWarning: false,
						emitWarning: false,
						useEslintrc: false,
						eslintPath: require.resolve('eslint'),
						baseConfig: {
							extends: [require.resolve('./eslintrc')]
						},
					},

				}],
				include: [
					paths.src,
					//Only lint source files in workspaceLinks
					// ...(Object.values(workspaceLinks).map(x => path.join(x, 'src')))
				],
				exclude: [/[/\\\\]node_modules[/\\\\]/],
			},

			{
				oneOf: [
					{
						test: /\.m?jsx?$/,
						exclude: [/[/\\\\]core-js[/\\\\]/, /[/\\\\]@babel[/\\\\]/],
						include: [
							paths.src,
						],
						use: [
							{
								//TODO: Limit this loader to nextthought code...
								loader: require.resolve('@nti/baggage-loader'),
								options: {
									'[file].scss':{},
									'[file].css':{}
								}
							},
							{
								loader: require.resolve('babel-loader'),
								options: {
									babelrc: false,
									cacheDirectory: !PROD,
									presets: [require.resolve('./babelrc')]
								}

							},
						]
					},

					{
						test: /\.(ico|gif|png|jpg|svg)(\?.*)?$/,
						loader: require.resolve('url-loader'),
						options: {
							limit: 50,
							name: 'resources/images/[hash].[ext]',
							mimeType: 'image/[ext]'
						}
					},

					{
						test: /\.(woff|ttf|eot|otf)(\?.*)?$/,
						loader: require.resolve('file-loader'),
						options: {
							name: 'resources/fonts/[hash].[ext]'
						}
					},

					{
						test: /\.(s?)css$/,
						use: [
							MiniCssExtractPlugin.loader,
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
									sourceMap: true,
									includePaths: [
										paths.resolveApp('src/main/resources/scss')
									]
								}
							}
						]
					}
				].filter(Boolean)
			}
		].filter(Boolean)
	},

	optimization: {
		occurrenceOrder: true,
		splitChunks: {
			cacheGroups: {
				commons: {
					chunks: 'initial',
					minChunks: 2
				},
				vendor: {
					test: (module) => (
						module.context
						&& /node_modules/.test(module.context)
						&& !isNTIPackage(module.context)
					),
					chunks: 'initial',
					name: 'vendor',
					priority: 10,
					enforce: true
				}
			}
		}
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

		new HtmlWebpackPlugin({
			alwaysWriteToDisk: true,
			filename: PROD ? 'page.html' : tmp.fileSync().name,
			template: paths.appHtml
		}),
		new HtmlWebpackHarddiskPlugin(),
		new PreloadWebpackPlugin(),

		new MiniCssExtractPlugin({
			filename: 'resources/[name].css',
			chunkFilename: 'resources/[id].css'
		}),

		new webpack.DefinePlugin({
			'BUILD_SOURCE': gitRevision,
			'BUILD_PACKAGE_NAME': JSON.stringify(pkg.name),
			'BUILD_PACKAGE_VERSION': JSON.stringify(pkg.version)
		}),

		// Watcher doesn't work well if you mistype casing in a path so we use
		// a plugin that prints an error when you attempt to do this.
		// See https://github.com/facebookincubator/create-react-app/issues/240
		new CaseSensitivePathsPlugin(),

		PROD && new CompressionPlugin(),

		// https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
		new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
	].filter(x => x)
};
