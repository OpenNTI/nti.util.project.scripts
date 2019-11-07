/*eslint camelcase:0*/
'use strict';
const DEBUG = process.argv.includes('--debug') || process.argv.includes('--profile');

const path = require('path');
const webpack = require('webpack');
const {isCI} = require('ci-info');
const tmp = require('tmp');
const chalk = require('chalk');
//Webpack plugins:
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const ProgressBarPlugin = require('@nti/progress-bar-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
//
const gitRevision = JSON.stringify(require('@nti/util-git-rev'));

const {loaders: cssLoaders, plugins: cssPlugins} = require('./css-loaders');
const {loaders: jsLoaders, preloaders: jsPreloaders} = require('./js-loaders');
const {PROD, ENV} = require('./env');
const paths = require('./paths');
const pkg = require(paths.packageJson);
const workspaceLinks = require('./workspace-links');


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
		filename: 'js/[name]-[hash:8].js',
		chunkFilename: 'js/[name]-[hash:8].js',
		pathinfo: !PROD,
		publicPath: paths.servedPath || '/',
		devtoolModuleFilenameTemplate: info =>
			path.resolve(info.absoluteResourcePath)
				.replace(path.resolve(paths.path), paths.servedPath)
				.replace('src/main', '')
				.replace(/\\/g, '/')
				.replace(/\/\//g, '/')
	},

	devtool: 'cheap-module-source-map',

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

	stats: 'errors-only',
	target: 'web',

	resolve: {
		modules: [
			paths.appModules,
			paths.nodeModules,
			'node_modules',//needed for conflicted versions of modules that get nested, but attempt last.
		],
		extensions: ['.js', '.jsx', '.mjs', '.mjsx'],
		alias: {
			...workspaceLinks(),
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

			...jsPreloaders(),

			{
				oneOf: [
					{
						test: /.*/,
						resourceQuery: /for-download/,
						loader: 'file-loader',
						options: {
							name: 'resources/files/[hash]/[name].[ext]'
						}
					},

					...jsLoaders({
						babel: {
							sourceType: 'unambiguous',
							presets: [
								require.resolve('./babel.config.js'),
								PROD && [require.resolve('babel-preset-minify'), {
									builtIns: false,
									mangle: false,
									deadcode: false,
									simplify: false,
									evaluate: false,
									consecutiveAdds: false
								}]
							].filter(Boolean),
						}
					}),

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

					...cssLoaders(paths, {
						sass: {
							sassOptions: {
								includePaths: [
									paths.resolveApp('src/main/resources/scss')
								]
							}
						}
					}),

				].filter(Boolean)
			}
		].filter(Boolean)
	},

	optimization: {
		minimize: false,
		minimizer: [PROD && new TerserPlugin({
			terserOptions: {
				parse: {
					// We want terser to parse ecma 8 code. However, we don't want it
					// to apply any minification steps that turns valid ecma 5 code
					// into invalid ecma 5 code. This is why the 'compress' and 'output'
					// sections only apply transformations that are ecma 5 safe
					// https://github.com/facebook/create-react-app/pull/4234
					ecma: 8
				},
				compress: {
					ecma: 5,
					warnings: false,
					// Disabled because of an issue with Uglify breaking seemingly valid code:
					// https://github.com/facebook/create-react-app/issues/2376
					// Pending further investigation:
					// https://github.com/mishoo/UglifyJS2/issues/2011
					comparisons: false,
					// Disabled because of an issue with Terser breaking valid code:
					// https://github.com/facebook/create-react-app/issues/5250
					// Pending further investigation:
					// https://github.com/terser-js/terser/issues/120
					inline: 2,
				},
				mangle: {
					safari10: true
				},
				// Added for profiling in devtools
				keep_classnames: true,
				keep_fnames: true,
				output: {
					ecma: 5,
					comments: false,
					// Turned on because emoji and regex is not minified properly using default
					// https://github.com/facebook/create-react-app/issues/2488
					ascii_only: true
				}
			},
			parallel: true,
			cache: true,
			sourceMap: true,
		})].filter(Boolean),
		sideEffects: true,
		splitChunks: {
			chunks: 'all',
			name: true,
			cacheGroups: {
				shared: {
					reuseExistingChunk: true,
					test: (module) => (
						module.context
						&& /node_modules/.test(module.context)
						&& isNTIPackage(module.context)
					),
				},
				vendor: {
					reuseExistingChunk: true,
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
		// https://github.com/facebook/create-react-app/issues/5358
		runtimeChunk: {
			name: entrypoint => `runtime-${entrypoint.name}`,
		}
	},

	performance: false,

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

		!isCI && new ProgressBarPlugin({
			format: '  build [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
		}),

		new HtmlWebpackPlugin({
			inject: true,
			alwaysWriteToDisk: true,
			filename: PROD ? 'page.html' : tempPage(),
			template: paths.appHtml,
			minify: {
				removeComments: false,
				collapseWhitespace: true,
				removeRedundantAttributes: true,
				useShortDoctype: true,
				removeEmptyAttributes: true,
				removeStyleLinkTypeAttributes: true,
				keepClosingSlash: true,
				minifyJS: true,
				minifyCSS: true,
				minifyURLs: true,
			}
		}),
		new HtmlWebpackHarddiskPlugin(),
		// new PreloadWebpackPlugin({
		// 	fileBlacklist: [
		// 		/admin/,
		// 		/\.map/,
		// 		/\/no-preload\//
		// 	]
		// }),

		// Inlines the webpack runtime script. This script is too small to warrant
		// a network request.
		// https://github.com/facebook/create-react-app/issues/5358
		new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),

		...cssPlugins(),

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
