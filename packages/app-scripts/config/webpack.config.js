/*eslint camelcase:0*/
'use strict';
const DEBUG = process.argv.includes('--debug') || process.argv.includes('--profile');

const path = require('path');
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
// const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
// const PreloadWebpackPlugin = require('preload-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
// const BabelMinifyPlugin = require('babel-minify-webpack-plugin');
//
const gitRevision = JSON.stringify(require('@nti/util-git-rev'));
const eslintFormatter = require('react-dev-utils/eslintFormatter');

const getVersionsFor = require('./resolve-versions');
const paths = require('./paths');
const pkg = require(paths.packageJson);

const DEVENV = 'development';
const ENV = process.env.NODE_ENV || DEVENV;
const PROD = ENV === 'production';
const VERSIONS = getVersionsFor(['react', 'react-dom', 'whatwg-fetch', 'airbrake-js']);

const getReactPath = (lib) => {
	const v = VERSIONS[lib];
	const major = parseInt(v, 10);
	const prefix = `${lib}@${v}/`;

	return (major < 16)
		? `${prefix}dist/${lib}${PROD ? '.min' : ''}.js`
		: `${prefix}umd/${lib}.${PROD ? 'production.min' : 'development'}.js`;
};

const browsers = require('@nti/lib-scripts/config/browserlist');
const getWorkspace = require('@nti/lib-scripts/config/workspace');
const workspaceLinks = (!PROD && paths.workspace)
	? getWorkspace(paths.workspace, paths.packageJson)
	: {};


function isNTIPackage (x) {
	const prefix = `${paths.nodeModules}/@nti/`;
	const descendent = /node_modules/;

	let str = x ? x.toString() : '';
	if(str.startsWith(prefix)) {
		str = str.substr(prefix.length);
		return !descendent.test(str);
	}
}


function tempPage () {
	return tempPage.file || (tempPage.file = tmp.fileSync().name);
}


exports = module.exports = {
	mode: ENV,
	bail: PROD,
	entry: {
		index: [
			require.resolve('./polyfills'),
			paths.appIndexJs
		]
	},
	//Hide this key from webpack, but allow our devmode module to access this value...
	[Symbol.for('template temp file')]: PROD ? void 0 : tempPage(),
	output: {
		path: paths.DIST_CLIENT,
		filename: 'js/[name]-[chunkhash:8].js',
		chunkFilename: 'js/[name]-[chunkhash:8].js',
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

	// Some libraries import Node modules but don't use them in the browser.
	// Tell Webpack to provide empty mocks for them so importing them works.
	node: {
		dgram: 'empty',
		fs: 'empty',
		net: 'empty',
		tls: 'empty',
		child_process: 'empty',
		crypto: 'empty',
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
			'@babel/runtime': path.dirname(
				require.resolve('@babel/runtime/package.json')
			),

			'core-js': path.dirname(
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
			{ parser: {
				// Disable non-standard language features
				requireInclude: !PROD, // disable require.include in production (the dev server uses this tho)
				requireEnsure: !PROD, // disable require.ensure in production (the dev server uses this tho)
				requireContext: !PROD, // disable require.context in production (the dev server uses this tho)
			} },

			{
				test: /\.m?jsx?$/,
				enforce: 'pre',
				use: [
					!PROD && {
						// First, run the linter.
						// It's important to do this before Babel processes the JS.
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
						}
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
					path.join(paths.nodeModules, '@nti'),
					//Only lint|baggage source files in workspaceLinks
					...(Object.values(workspaceLinks).map(x => path.join(x, 'src')))
				],
				// exclude: [/[/\\\\]node_modules[/\\\\]/],
			},

			{
				oneOf: [
					{
						test: /\.m?jsx?$/,
						exclude: [/[/\\\\]core-js[/\\\\]/, /[/\\\\]@babel[/\\\\]/],
						use: [
							{
								loader: require.resolve('thread-loader'),
								options: {
									poolTimeout: Infinity, // keep workers alive for more effective watch mode
								},
							},
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
									compact: false,
									cacheDirectory: false,
									cacheCompression: false,
									highlightCode: true,
									sourceType: 'unambiguous',
									presets: [
										require.resolve('./babel.config.js'),
										PROD && [require.resolve('babel-preset-minify'), {
											mangle: false,
											deadcode: false,
											// simplify: false,
											evaluate: false,
										}]
									].filter(Boolean)
								}
							},
						].filter(Boolean)
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
						test: /\.(sa|sc|c)ss$/,
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
										require('postcss-flexbugs-fixes'),
										require('postcss-preset-env')({
											browsers,
											autoprefixer: {
												flexbox: 'no-2009',
											},
											stage: 3,
										}),
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
			// new BabelMinifyPlugin({}, {
			// 	exclude: /runtime[^/]*\.js($|\?)/i,
			// }),

			new UglifyJsPlugin({
				parallel: true,
				sourceMap: true,
			}),

			// new OptimizeCSSAssetsPlugin({
			// 	cssProcessorOptions: {
			// 		reduceIdents: false
			// 	}
			// }),
		],
		sideEffects: true,
		splitChunks: {
			chunks: 'all',
			name: true,
			cacheGroups: {
				// commons: {
				// 	minChunks: 2
				// },
				shared: {
					test: (module) => (
						module.context
						&& /node_modules/.test(module.context)
						&& isNTIPackage(module.context)
					),
				},
				vendor: {
					test: (module) => (
						module.context
						&& /node_modules/.test(module.context)
						&& !isNTIPackage(module.context)
					),
				},
			}
		},
		// Keep the runtime chunk seperated to enable long term caching
		// https://twitter.com/wSokra/status/969679223278505985
		runtimeChunk: true,
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
			publicPath: '',
			append: false,
			assets: [
				{ path: `https://unpkg.com/airbrake-js@${VERSIONS['airbrake-js']}`, type: 'js' },
				{ path: `https://unpkg.com/whatwg-fetch@${VERSIONS['whatwg-fetch']}`, type: 'js' },
				{ path: `https://unpkg.com/${getReactPath('react')}`, type: 'js' },
				{ path: `https://unpkg.com/${getReactPath('react-dom')}`, type: 'js' },
			]
		}),
		// new PreloadWebpackPlugin({
		// 	fileBlacklist: [
		// 		/admin/,
		// 		/\.map/,
		// 		/\/no-preload\//
		// 	]
		// }),

		new MiniCssExtractPlugin({
			filename: 'resources/[name]-[contenthash].css'
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
