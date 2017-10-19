'use strict';
const DEBUG = process.argv.includes('--debug') || process.argv.includes('--profile');

const path = require('path');
const autoprefixer = require('autoprefixer');
const webpack = require('webpack');
// const AppCachePlugin = require('appcache-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const {StatsWriterPlugin} = require('webpack-stats-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const gitRevision = JSON.stringify(require('nti-util-git-rev'));
const eslintFormatter = require('react-dev-utils/eslintFormatter');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin');

const paths = require('./paths');
const pkg = require(paths.packageJson);
const ENV = process.env.NODE_ENV || 'development';
const PROD = ENV === 'production';

// const prefetch = [];
const sourceMapInclude = [];
const sourceMapExclude = [
	paths.nodeModules
];

for (let dep of Object.keys(Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {}))) {
	try {
		if (/^nti-/.test(dep)) {
			const i = require.resolve(dep);
			sourceMapInclude.push(i);
			sourceMapExclude.push(path.join(i, 'node_modules'));
		}
	} catch (e) {
		//meh
	}
}


function isNTIPackage (x) {
	const prefix = `${paths.nodeModules}/nti-`;
	const decendent = /node_modules/;

	let str = x ? x.toString() : '';
	if(str.startsWith(prefix)) {
		str = str.substr(prefix.length);
		return !decendent.test(str);
	}
}


exports = module.exports = {
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

	target: 'web',

	resolve: {
		modules: [
			// 'node_modules',
			paths.nodeModules,
			paths.appModules,
			paths.resolveApp('src/main/resources/scss'),
		],
		extensions: ['.jsx', '.async.jsx', '.js'],
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

	node: {
		crypto: 'empty'
	},

	externals: [
		{
			'extjs': 'Ext',
			'react' : 'React',
			'react-dom': 'ReactDOM',
			'react/lib/ReactCSSTransitionGroup': 'React.addons.CSSTransitionGroup'
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
					!PROD && {
						options: {
							formatter: eslintFormatter,
							ignore: false,
							failOnError: true,
							failOnWarning: false,
							emitWarning: false
						},
						loader: require.resolve('eslint-loader'),
					},
				].filter(Boolean),
				include: paths.appModules,
			},

			{
				test: /\.jsx?$/,
				enforce: 'pre',
				loader: require.resolve('source-map-loader'),
				include: sourceMapInclude,
				exclude: sourceMapExclude
			},

			{
				test: /\.async\.jsx?$/,
				loader: require.resolve('react-proxy-loader')
			},
			{
				test: /\.jsx?$/,
				include: [paths.src],
				loader: require.resolve('babel-loader')
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
								sourceMap: true,
								includePaths: [
									paths.resolveApp('src/main/resources/scss')
								]
							}
						}
					]
				})
			}
		].filter(Boolean)
	},

	plugins: [
		new webpack.EnvironmentPlugin({
			NODE_ENV: PROD ? 'production' : 'development'
		}),

		// Add module names to factory functions so they appear in browser profiler.
		new webpack.NamedModulesPlugin(),

		// ...prefetch,

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

		PROD && new StatsWriterPlugin({
			filename: '../compile-data.json',
			transform: ({assetsByChunkName}) => JSON.stringify({assetsByChunkName})
		}),

		// new AppCachePlugin({
		// 	cache: [
		// 		'page.html',
		// 		'offline.json',
		// 		'resources/images/favicon.ico',
		// 		'resources/images/app-icon.png',
		// 		'resources/images/app-splash.png'
		// 	],
		// 	network: [
		// 		'/dataserver2/',
		// 		'/content/',
		// 		'*'
		// 	],
		// 	fallback: ['/dataserver2/ offline.json', '/ page.html'],
		// 	settings: ['prefer-online'],
		// 	exclude: [],
		// 	output: 'manifest.appcache'
		// }),

		PROD && webpack.optimize.ModuleConcatenationPlugin && new webpack.optimize.ModuleConcatenationPlugin(),

		new webpack.optimize.CommonsChunkPlugin({
			name: 'vendor',
			minChunks: (module) => (
				module.context
				&& /node_modules/.test(module.context)
				&& !isNTIPackage(module.context)
			)
		}),

		new ExtractTextPlugin({
			filename: 'resources/styles.css',
			allChunks: true,
			disable: false
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

		// If you require a missing module and then `npm install` it, you still have
		// to restart the development server for Webpack to discover it. This plugin
		// makes the discovery automatic so you don't have to restart.
		// See https://github.com/facebookincubator/create-react-app/issues/186
		!PROD && new WatchMissingNodeModulesPlugin(paths.appNodeModules),

		PROD && new webpack.optimize.UglifyJsPlugin({
			compress: { warnings: false },
			output: {
				comments: false,
			},
			sourceMap: true,
			test: /\.js(x?)($|\?)/i,
		}),


		PROD && new CompressionPlugin(),
	].filter(x => x)
};
