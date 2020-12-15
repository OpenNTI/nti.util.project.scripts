'use strict';
const path = require('path');
const browsers = require('@nti/lib-scripts/config/browserlist');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const {PROD} = require('./env');
const workspaceLinks = require('./workspace-links');

const style = (server) => ({
	loader: (!PROD && !server) ? 'style-loader' : MiniCssExtractPlugin.loader,
	options: {
		esModule: false
	}
});

const css = (options = {}) => ({
	loader: require.resolve('css-loader'),
	options: {
		...options
	}
});

const postCss = (paths, options = {}) => ({
	loader: require.resolve('postcss-loader'),
	options: {
		postcssOptions: {
			plugins: [
				require('postcss-flexbugs-fixes'),
				require('postcss-preset-env')({
					browsers,
					autoprefixer: {
						overrideBrowserslist: browsers,
						flexbox: 'no-2009',
						grid: true,
					},
					importFrom: paths.cssCustomProperties,
					stage: 3,
					features: {
						'nesting-rules': true
					}
				}),
			],
			...options
		}
	}
});

const resolveUrl = (options = {}) => ({
	loader: require.resolve('resolve-url-loader'),
	...options
});

const sass = (options = {}) => ({
	loader: require.resolve('sass-loader'),
	options: {
		implementation: require('sass'),
		...options,
		sassOptions: {
			fiber: require('fibers'),
			...options.sassOptions,
		},
	}
});

const loaders = (paths, options = {}) => [
	{
		test: /\.s(a|c)ss$/,
		use: [
			style(options.server),
			css(),
			postCss(paths),
			resolveUrl(),
			sass(options.sass)
		]
	},

	{
		test: /\.css$/,
		include: [
			paths.src,
			paths.testApp,
			paths.ntiModules,
			//Only process source files in workspaceLinks
			...(Object.values(workspaceLinks()).map(x => path.join(x, 'src'))),
		].filter(Boolean),
		use: [
			style(options.server),
			css({
				modules: {
					exportGlobals: true,
					exportLocalsConvention: 'camelCase',
					localIdentName: '[local]--[hash:base64:8]'
				}
			}),
			postCss(paths),
			resolveUrl()
		]
	},

	{
		test: /\.css$/,
		use: [
			style(options.server),
			css({importLoaders: 2}),
			postCss(paths),
			resolveUrl()
		]
	}
];

const plugins = (options = {}, server = false) => [
	(PROD || server) && new MiniCssExtractPlugin({
		ignoreOrder: true,
		filename: 'resources/[name]-[contenthash].css',
		...(options.miniCssExtract || {})
	})
].filter(Boolean);

module.exports = {
	loaders,
	plugins
};
