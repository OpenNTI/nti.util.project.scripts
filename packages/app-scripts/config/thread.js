'use strict';
const threadLoader = require('thread-loader');

const {PROD} = require('./env');

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
		options: {
			poolParallelJobs: 50,
			...(PROD ? {} : {poolTimeout: Infinity}), // keep workers alive for more effective watch mode})
			...options
		}
	};
};
