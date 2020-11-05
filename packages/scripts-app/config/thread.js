'use strict';
const {PROD} = require('./env');

let threadLoader;

module.exports = function thread (options = {}) {
	if(!process.env.NTI_THREADED_BUILD) {
		return;
	}

	if (typeof options !== 'object') {
		options = {};
	}

	if (!threadLoader) {
		threadLoader = require('thread-loader');
		threadLoader.warmup(options, [
			'babel-loader',
			require.resolve('./babel.config.js')
		]);
	}


	return {
		loader: require.resolve('thread-loader'),
		options: {
			// workerParallelJobs: 50,
			workers: require('os').cpus(),
			...(PROD ? {} : {poolTimeout: Infinity}), // keep workers alive for more effective watch mode})
			...options
		}
	};
};
