'use strict';
const path = require('path');
const autoprefixer = require('autoprefixer');
const webpack = require('webpack');
// const AppCachePlugin = require('appcache-webpack-plugin');
const StatsPlugin = require('stats-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const gitRevision = JSON.stringify(require('nti-util-git-rev'));
const eslintFormatter = require('react-dev-utils/eslintFormatter');

const paths = require('./paths');

const ENV = process.env.NODE_ENV || 'development';
const PROD = ENV === 'production';

const modules = paths.nodeModules;

//fake out the plugin (it does an instanceof test)
const NTI_PACKAGES = Object.assign(new RegExp(''), {
	prefix: `${modules}/nti-`,
	decendent: /node_modules/,

	test (x) {
		let str = x ? x.toString() : '';
		if(str.startsWith(this.prefix)) {
			str = str.substr(this.prefix.length);
			return !this.decendent.test(str);
		}
	}
});


exports = module.exports = {
	bail: PROD,
	entry: {
		index: [require.resolve('./polyfills'), paths.appIndexJs]
	},
	output: {
		path: paths.DIST_CLIENT,
		filename: 'js/[name]-[chunkhash:8].js',
		chunkFilename: 'js/[name].chunk.[chunkhash:8].js',
		publicPath: '/',
		// Point sourcemap entries to original disk location
		devtoolModuleFilenameTemplate: info => path.relative(paths.src, info.absoluteResourcePath),
	},

	cache: !PROD,
	devtool: PROD ? 'source-map' : 'cheap-module-source-map',

	target: 'web',

	resolve: {
		modules: [
			'node_modules',
			// paths.nodeModules,
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
			'react' : 'React',
			'react-dom': 'ReactDOM'
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
				include: paths.appModules,
			},

			{
				test: /\.jsx?$/,
				enforce: 'pre',
				loader: require.resolve('source-map-loader')
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
		]
	},

	plugins: [
		new webpack.EnvironmentPlugin({
			NODE_ENV: PROD ? 'production' : 'development'
		}),

		PROD && new StatsPlugin('../compile-data.json'),

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


		new webpack.optimize.CommonsChunkPlugin({
			name: 'vendor',
			// names: ['vendor', 'manifest'],
			// children: true,
			minChunks: (module) => (
				module.context
				&& /node_modules/.test(module.context)
				&& !NTI_PACKAGES.test(module.context)
			)
		}),

		new ExtractTextPlugin({
			filename: 'resources/styles.css',
			allChunks: true,
			disable: false
		}),

		new webpack.DefinePlugin({
			'BUILD_SOURCE': gitRevision
		}),

		PROD && new webpack.optimize.UglifyJsPlugin({
			compress: { warnings: false },
			output: {
				comments: false,
			},
			sourceMap: true,
			test: /\.js(x?)($|\?)/i,
		}),

		// Moment.js is an extremely popular library that bundles large locale files
		// by default due to how Webpack interprets its code. This is a practical
		// solution that requires the user to opt into importing specific locales.
		// https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
		new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

		PROD && new CompressionPlugin(),
	].filter(x => x)
};
