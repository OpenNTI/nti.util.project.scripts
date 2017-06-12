'use strict';
const autoprefixer = require('autoprefixer');
const webpack = require('webpack');
const StatsPlugin = require('stats-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const gitRevision = JSON.stringify(require('nti-util-git-rev'));

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
	entry: {
		index: paths.appIndexJs
	},
	output: {
		path: paths.DIST_CLIENT,
		filename: 'js/[name]-[chunkhash].js',
		publicPath: '/'
	},

	cache: true,
	devtool: PROD ? 'source-map' : 'cheap-module-source-map',

	target: 'web',

	resolve: {
		modules: [
			paths.appModules,
			paths.resolveApp('src/main/resources/scss'),
			paths.nodeModules
		],
		extensions: ['.jsx', '.js']
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
		rules: [
			{
				test: /\.jsx?$/,
				enforce: 'pre',
				loader: 'baggage-loader',
				options: {
					'[file].scss':{}
				}
			},
			{
				test: /\.jsx?$/,
				enforce: 'pre',
				loader: 'source-map-loader'
			},
			{
				test: /\.async\.jsx?$/,
				loader: 'react-proxy-loader'
			},
			{
				test: /\.jsx?$/,
				include: paths.src,
				loader: 'babel-loader'
			},
			{
				test: /\.(ico|gif|png|jpg|svg)(\?.*)?$/,
				loader: 'url-loader',
				options: {
					limit: 50,
					name: 'resources/images/[hash].[ext]',
					mimeType: 'image/[ext]'
				}
			},
			{
				test: /\.(woff|ttf|eot|otf)(\?.*)?$/,
				loader: 'file-loader',
				options: {
					name: 'resources/fonts/[hash].[ext]'
				}
			},

			{
				test: /\.(s?)css$/,
				use: ExtractTextPlugin.extract({
					fallback: 'style-loader',
					use: [
						{
							loader: 'css-loader',
							options: {
								sourceMap: true
							}
						},
						{
							loader: 'postcss-loader',
							options: {
								sourceMap: true,
								plugins: () => [
									autoprefixer({ browsers: ['> 1% in US', 'last 2 versions', 'iOS > 8'] })
								]
							}
						},
						{
							loader: 'resolve-url-loader'
						},
						{
							loader: 'sass-loader',
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
		new webpack.EnvironmentPlugin({
			NODE_ENV: PROD ? 'production' : 'development'
		}),

		PROD && new StatsPlugin('../compile-data.json'),

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
			sourceMap: true,
			test: /\.js(x?)($|\?)/i
		})

	].filter(x => x)
};
