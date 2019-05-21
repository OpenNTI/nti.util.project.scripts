'use strict';
const path = require('path');
const browsers = require('@nti/lib-scripts/config/browserlist');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const cache = require('./cache');
const {PROD} = require('./env');
const paths = require('./paths');
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

const postCss = (options = {}) => ({
	loader: require.resolve('postcss-loader'),
	options: {
		sourceMap: true,
		plugins: () => [
			require('postcss-flexbugs-fixes'),
			require('postcss-preset-env')({
				browsers,
				autoprefixer: {
					browsers,
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
		...options
	}
});

const loaders = (options = {}) => [
	{
		test: /\.s(a|c)ss$/,
		use: [
			style(),
			cache(),
			css(),
			postCss(),
			resolveUrl(),
			sass(options.sass)
		]
	},
	
	{
		test: /\.css$/,
		include: [
			paths.src,
			paths.ntiModules,
			//Only lint|baggage source files in workspaceLinks
			...(Object.values(workspaceLinks()).map(x => path.join(x, 'src'))),
		],
		use: [
			style(),
			cache(),
			css({
				modules: true,
				localIdentName: '[local]--[hash:base64:8]'
			}),
			postCss(),
			resolveUrl()
		]
	},

	{
		test: /\.css$/,
		use: [
			style(),
			cache(),
			css(),
			postCss(),
			resolveUrl()
		]
	}
];

const plugins = (options = {}) => [
	PROD && new MiniCssExtractPlugin({
		filename: 'resources/[name]-[contenthash].css',
		...(options.miniCssExtract || {})
	})
].filter(Boolean);

module.exports = {
	loaders,
	plugins
};