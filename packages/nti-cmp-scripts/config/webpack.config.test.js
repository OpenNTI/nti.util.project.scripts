'use strict';
const paths = require('./paths');

exports = module.exports = Object.assign(require('./webpack.config'), {
	entry: paths.resolveApp('./test/app/index.js'),
	externals: [],
	output: {
		path: '/',
		filename: 'index.js'
		// publicPath: '/'
	}
});

delete exports.node;

exports.module.rules.push({
	test: /\.(eot|ttf|woff)$/,
	loader: require.resolve('file-loader'),
	query: {
		name: 'assets/fonts/[name]-[hash].[ext]'
	}
});
