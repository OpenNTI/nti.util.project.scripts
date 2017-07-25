'use strict';
const paths = require('./paths');

exports = module.exports = Object.assign(require('./webpack.config'), {
	entry: {
		index: [
			require.resolve('babel-polyfill'),
			paths.resolveApp('./test/app/index.js')
		]
	},
	externals: [],
	output: {
		path: '/',
		filename: 'index.js'
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
		allowedHosts: ['.dev'],
		clientLogLevel: 'none',
		contentBase: paths.resolveApp('test/app/'),
		watchContentBase: true,
		overlay: true,
		noInfo: true
	}
});


exports.module.rules.push({
	test: /\.(eot|ttf|woff)$/,
	loader: require.resolve('file-loader'),
	query: {
		name: 'assets/fonts/[name]-[hash].[ext]'
	}
});
