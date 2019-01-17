'use strict';

const browsers = require('@nti/lib-scripts/config/browserlist');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const cache = require('./cache');
const {PROD} = require('./env');
const paths = require('./paths');

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
		includePaths: [
			paths.resolveApp('src/main/resources/scss')
		],
		...options
	}
});

const loaders = () => [
	{
		test: /\.s(a|c)ss$/,
		use: [
			style(),
			cache(),
			css(),
			postCss(),
			resolveUrl(),
			sass()
		]
	},
	
	{
		test: /\.css$/,
		exclude: [
			paths.nodeModules
		],
		use: [
			style(),
			cache(),
			css({modules: true}),
			postCss(),
			resolveUrl()
		]
	},

	{
		test: /\.css$/,
		include: [
			paths.nodeModules
		],
		use: [
			style(),
			cache(),
			css(),
			postCss(),
			resolveUrl()
		]
	}
];

const plugins = () => [
	new MiniCssExtractPlugin({
		filename: 'resources/[name]-[contenthash].css'
	})
];

module.exports = {
	loaders,
	plugins
};
