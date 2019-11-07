'use strict';
const path = require('path');
const browsers = require('@nti/lib-scripts/config/browserlist');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const cache = require('./cache');
const {PROD} = require('./env');
const workspaceLinks = require('./workspace-links');

const style = () => (
	!PROD ? 'style-loader' : MiniCssExtractPlugin.loader
);

const css = (options = {}) => ({
	loader: require.resolve('css-loader'),
	options: {
		sourceMap: true,
		...options
	}
});

const postCss = (paths, options = {}) => ({
	loader: require.resolve('postcss-loader'),
	options: {
		sourceMap: true,
		plugins: () => [
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
			}),
		],
		...options
	}
});

const resolveUrl = (options = {}) => ({
	loader: require.resolve('resolve-url-loader'),
	...options
});

const sass = (options = {}) => ({
	loader: require.resolve('sass-loader'),
	options: {
		sourceMap: true,
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
			style(),
			cache(),
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
			//Only lint|baggage source files in workspaceLinks
			...(Object.values(workspaceLinks()).map(x => path.join(x, 'src'))),
		].filter(Boolean),
		use: [
			style(),
			cache(),
			css({
				modules: {
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
			style(),
			cache(),
			css({importLoaders: 2}),
			postCss(paths),
			resolveUrl()
		]
	}
];

const plugins = (options = {}) => [
	PROD && new MiniCssExtractPlugin({
		ignoreOrder: true,
		filename: 'resources/[name]-[contenthash].css',
		...(options.miniCssExtract || {})
	})
].filter(Boolean);

module.exports = {
	loaders,
	plugins
};
