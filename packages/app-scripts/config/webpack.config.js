'use strict';
const DEBUG = process.argv.includes('--debug') || process.argv.includes('--profile');

const path = require('path');
const autoprefixer = require('autoprefixer');
const webpack = require('webpack');
const {isCI} = require('ci-info');
const tmp = require('tmp');
//Webpack plugins:
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');
const PreloadWebpackPlugin = require('preload-webpack-plugin');
const ClosureCompilerPlugin = require('webpack-closure-compiler');
//
const gitRevision = JSON.stringify(require('@nti/util-git-rev'));
const eslintFormatter = require('react-dev-utils/eslintFormatter');

const getVersionsFor = require('./resolve-versions');
const paths = require('./paths');
const pkg = require(paths.packageJson);

const DEVENV = 'development';
const ENV = process.env.NODE_ENV || DEVENV;
const PROD = ENV === 'production';
const VERSIONS = getVersionsFor(['react', 'react-dom', 'whatwg-fetch']);
const REACT_MODE = PROD ? ENV : DEVENV;

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


function tempPage () {
	return tempPage.file || (tempPage.file = tmp.fileSync().name);
}


exports = module.exports = {
	mode: ENV,
	bail: PROD,
	entry: {
		index: [require.resolve('./polyfills'), paths.appIndexJs]
	},
	//Hide this key from webpack, but allow our devmode module to access this value...
	[Symbol.for('template temp file')]: PROD ? void 0 : tempPage(),
	output: {
		path: paths.DIST_CLIENT,
		filename: 'js/[id]-[chunkhash:8].js',
		chunkFilename: 'js/[id]-[chunkhash:8].js',
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
			paths.appModules,
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
			'@nti/extjs': 'Ext',
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
						// We can't lock the config until we can delete the web-app's lecgacy directory
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
								// options: {
								// 	babelrc: false,
								// 	cacheDirectory: !PROD,
								// 	presets: [require.resolve('./babelrc')]
								// }

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
		minimize: PROD,
		minimizer: [
			new ClosureCompilerPlugin({
				concurrency: 4
			}),
		],
		occurrenceOrder: true,
		splitChunks: {
			cacheGroups: {
				commons: {
					chunks: 'initial',
					minChunks: 2
				},
				shared: {
					test: (module) => (
						module.context
						&& /node_modules/.test(module.context)
						&& isNTIPackage(module.context)
					),
					chunks: 'initial',
					name: 'shared',
					enforce: true
				},
				vendor: {
					test: (module) => (
						module.context
						&& /node_modules/.test(module.context)
						&& !isNTIPackage(module.context)
					),
					chunks: 'initial',
					name: 'vendor',
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

		!isCI && new webpack.ProgressPlugin({profile: false}),

		new HtmlWebpackPlugin({
			alwaysWriteToDisk: true,
			filename: PROD ? 'page.html' : tempPage(),
			template: paths.appHtml
		}),
		new HtmlWebpackHarddiskPlugin(),
		new HtmlWebpackIncludeAssetsPlugin({
			append: false,
			assets: [
				{ path: `https://cdnjs.cloudflare.com/ajax/libs/react/${VERSIONS['react']}/umd/react.${REACT_MODE}.js`, type: 'js' },
				{ path: `https://cdnjs.cloudflare.com/ajax/libs/react-dom/${VERSIONS['react-dom']}/umd/react-dom.${REACT_MODE}.js`, type: 'js' },
				{ path: `https://cdnjs.cloudflare.com/ajax/libs/fetch/${VERSIONS['whatwg-fetch']}/fetch.min.js`, type: 'js' },
			]
		}),
		new PreloadWebpackPlugin(),

		new MiniCssExtractPlugin({
			filename: 'resources/[id]-[chunkhash:8].css'
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
	].filter(Boolean)
};
