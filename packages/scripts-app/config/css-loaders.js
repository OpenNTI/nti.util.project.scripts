'use strict';
const path = require('path');
const browsers = require('@nti/lib-scripts/config/browserlist');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const { PROD } = require('./env');
const getWorkspace = require('./workspace');
const NotInNodeModules = /^((?!\/node_modules\/).)+$/i;

const requireMaybe = id => {
	try {
		return require('fibers');
	} catch {
		return false;
	}
};

const style = inline => ({
	loader: !PROD && inline ? 'style-loader' : MiniCssExtractPlugin.loader,
	options: {
		esModule: false,
	},
});

const css = (options = {}) => ({
	loader: require.resolve('css-loader'),
	options: {
		...options,
	},
});

const postCss = (paths, options = {}) => ({
	loader: require.resolve('postcss-loader'),
	options: {
		postcssOptions: {
			plugins: [
				require('postcss-flexbugs-fixes'),
				require('postcss-nested'),
				require('postcss-preset-env')({
					browsers,
					autoprefixer: {
						overrideBrowserslist: browsers,
						flexbox: 'no-2009',
						grid: true,
					},
					importFrom: [paths.cssCustomProperties],
					stage: 3,
					features: {
						'custom-media-queries': true,
						'custom-selectors': true,
						'nesting-rules': true,
					},
				}),
			],
			...options,
		},
	},
});

const resolveUrl = (options = {}) => ({
	loader: require.resolve('resolve-url-loader'),
	...options,
});

const sass = (options = {}) => ({
	loader: require.resolve('sass-loader'),
	options: {
		...options,
		implementation: require('sass'),
		sourceMap: true, // resolve loader requires sourceMaps on for loaders that come before it
		sassOptions: {
			fiber: requireMaybe('fibers'),
			...options.sassOptions,
		},
	},
});

const loaders = (paths, options = {}) => {
	const ntiStyleDirs = [
		paths.src,
		paths.testApp,
		paths.ntiModules,
		NotInNodeModules,
		//Only process source files in workspace
		...(getWorkspace().projects || []).map(x => path.join(x, 'src')),
	].filter(Boolean);

	return [
		{
			test: /\.s(a|c)ss$/,
			sideEffects: true,
			use: [
				style(options.inline),
				css(),
				postCss(paths),
				resolveUrl(),
				sass(options.sass),
			],
		},

		{
			test: /\.css$/,
			include: ntiStyleDirs,
			sideEffects: true,
			use: [
				style(options.inline),
				css({
					modules: {
						exportGlobals: true,
						exportLocalsConvention: 'camelCase',
						localIdentName: '[local]--[hash:base64:8]',
					},
				}),
				postCss(paths),
			],
		},

		{
			test: /\.css$/,
			sideEffects: true,
			exclude: ntiStyleDirs,
			use: [
				style(options.inline),
				css({ importLoaders: 1 }),
				postCss(paths),
			],
		},
	];
};

const plugins = (options = {}, inline = false) =>
	[
		(PROD || !inline) &&
			new MiniCssExtractPlugin({
				ignoreOrder: true,
				filename: 'resources/[name]-[contenthash].css',
				...(options.miniCssExtract || {}),
			}),
	].filter(Boolean);

module.exports = {
	loaders,
	plugins,
};
