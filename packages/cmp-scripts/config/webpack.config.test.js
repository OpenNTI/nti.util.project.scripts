'use strict';
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');
const getVersionsFor = require('@nti/app-scripts/config/resolve-versions');
const paths = require('./paths');
const pkg = require(paths.packageJson);

const VERSIONS = getVersionsFor(['whatwg-fetch']);

exports = module.exports = Object.assign(require('./webpack.config'), {
	entry: {
		index: [
			require.resolve('./polyfills'),
			paths.resolveApp('./test/app/index.js')
		]
	},
	externals: [],
	output: {
		path: '/',
		filename: '[name].js'
		// publicPath: '/'
	},
	node: {
		dgram: 'empty',
		fs: 'empty',
		net: 'empty',
		tls: 'empty',
	},
	performance: {
		hints: false,
	},
	devServer: {
		disableHostCheck: true,
		allowedHosts: ['.dev', '.local'],
		clientLogLevel: 'none',
		contentBase: paths.resolveApp('test/app/'),
		watchContentBase: true,
		overlay: {
			warnings: false,
			errors: true
		},
		noInfo: true,
		proxy: [{
			context: ['/content', '/dataserver2'],
			target: 'http://localhost:8082',
		}]
	}
});

exports.plugins.push(
	new HtmlWebpackPlugin({
		title: pkg.name + ': Test Harness',
		template: paths.exists(paths.testAppHtml, paths.testAppHtmlTemplate)
	}),
	new HtmlWebpackIncludeAssetsPlugin({
		publicPath: '',
		append: false,
		assets: [
			{ path: `https://cdnjs.cloudflare.com/ajax/libs/fetch/${VERSIONS['whatwg-fetch']}/fetch.min.js`, type: 'js' },
		]
	}),
);
