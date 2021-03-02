/*eslint camelcase:0*/
'use strict';
process.env.NODE_ENV = 'development';

//Webpack plugins:
// const BitBarWebpackProgressPlugin = require('BitBarWebpackProgressPlugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const paths = require('./paths');

const { plugins: jsPlugins } = require('@nti/app-scripts/config/js-loaders');
const { plugins: cssPlugins } = require('@nti/app-scripts/config/css-loaders');
const [app] = require('@nti/app-scripts/config/webpack.config');

const { name } = require(paths.packageJson);

// Once all test harness instances have been replaced with storybook stories,
// we can delete this and migrate the important parts to the storybook config file.

exports = module.exports = {
	...app,
	entry: {
		index: [
			require.resolve('./polyfills'),
			paths.resolveApp('./test/app/index.js'),
		],
	},

	output: {
		path: '/',
		filename: '[name].js',
		publicPath: '/',
	},

	optimization: {
		minimize: false,
	},

	devServer: {
		disableHostCheck: true,
		allowedHosts: ['.dev', '.local'],
		clientLogLevel: 'none',
		contentBase: paths.resolveApp('test/app/'),
		watchContentBase: true,
		overlay: {
			warnings: false,
			errors: true,
		},
		proxy: [
			{
				context: ['/content', '/dataserver2'],
				target: 'https://app.localhost',
			},
		],
		stats: 'errors-only',
	},

	plugins: [
		...jsPlugins(),
		...cssPlugins({
			miniCssExtract: {
				filename: 'index.generated.css',
			},
		}),

		new HtmlWebpackPlugin({
			title: `${name}: Test Harness`,
			template: paths.exists(
				paths.testAppHtml,
				paths.testAppHtmlTemplate
			),
		}),

		// Watcher doesn't work well if you mistype casing in a path so we use
		// a plugin that prints an error when you attempt to do this.
		// See https://github.com/facebookincubator/create-react-app/issues/240
		new CaseSensitivePathsPlugin(),
	].filter(Boolean),
};
