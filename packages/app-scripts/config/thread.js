'use strict';
const threadLoader = require('thread-loader');

module.exports = function thread (options = {}) {
	if (typeof options !== 'object') {
		options = {};
	}

	threadLoader.warmup(options, [
		'babel-loader',
		require.resolve('./babel.config.js')
	]);

	return {
		loader: require.resolve('thread-loader'),
		options
	};
};
