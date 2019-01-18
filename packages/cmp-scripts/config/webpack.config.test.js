'use strict';
const HtmlWebpackPlugin = require('html-webpack-plugin');
const paths = require('./paths');
const pkg = require(paths.packageJson);

process.env.NODE_ENV = 'development';

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
		filename: '[name].js',
		publicPath: '/'
	},
	node: {
		dgram: 'empty',
		fs: 'empty',
		net: 'empty',
		tls: 'empty',
	},
	performance: false,
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
);

const {pattern} = require('@nti/app-scripts/config/js-loaders');
const jsPre = exports.module.rules.find(x => 
	x.enforce === 'pre'
	&& x.test === pattern
	&& x.use.some(r => '[file].scss' in r.options)
);

jsPre.include.push(paths.testApp);
