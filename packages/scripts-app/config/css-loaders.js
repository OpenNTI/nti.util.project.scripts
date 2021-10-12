'use strict';
const browsers = require('@nti/lib-scripts/config/browserlist');

const { MiniCssExtractPlugin } = require('./webpack.plugins');
const { PROD } = require('./env');
const NotInNodeModules = /^((?!\/node_modules\/).)+$/i;

const style = inline => ({
	loader: !PROD && inline ? 'style-loader' : MiniCssExtractPlugin.loader,
	options: {
		esModule: false,
	},
});

const css = (options = {}) => ({
	loader: require.resolve('css-loader'),
	options: {
		sourceMap: true,
		...options,
	},
});

const postCss = (paths, options = {}) => ({
	loader: require.resolve('postcss-loader'),
	options: {
		sourceMap: true,
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

const resolveUrl = options => ({
	loader: require.resolve('resolve-url-loader'),
	options: {
		sourceMap: true,
		...options,
	},
});

const sass = (options = {}) => ({
	loader: require.resolve('sass-loader'),
	options: {
		...options,
		implementation: require('sass'),
		sourceMap: true, // resolve loader requires sourceMaps on for loaders that come before it
		sassOptions: {
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
					importLoaders: 1,
					modules: {
						exportGlobals: true,
						exportLocalsConvention: 'camelCase',
						localIdentName: PROD
							? '[hash:base64]' //'[hash:base64]'
							: '[path][name]__[local]--[hash:base64]',
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
				// ignoreOrder: true,
				filename: 'resources/[name]-[contenthash].css',
				...(options.miniCssExtract || {}),
			}),
	].filter(Boolean);

module.exports = {
	loaders,
	plugins,
};
