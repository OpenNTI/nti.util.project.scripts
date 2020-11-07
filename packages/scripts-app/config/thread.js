'use strict';
const loader = require.resolve('thread-loader');
const {PROD} = require('./env');

let threadLoader;

module.exports = function thread () {
	if(!process.env.NTI_THREADED_BUILD) {
		return;
	}

	const options = {
		// the number of spawned workers, defaults to (number of cpus - 1) or
		// fallback to 1 when require('os').cpus() is undefined
		workers: require('os').cpus(),

		// number of jobs a worker processes in parallel
		// defaults to 20
		workerParallelJobs: 50,

		// additional node.js arguments
		// workerNodeArgs: ['--max-old-space-size=1024'],

		// Allow to respawn a dead worker pool
		// respawning slows down the entire compilation
		// and should be set to false for development
		// poolRespawn: false,

		// timeout for killing the worker processes when idle
		// defaults to 500 (ms)
		// can be set to Infinity for watching builds to keep workers alive
		// poolTimeout: 2000,
		...(PROD ? {} : {poolTimeout: Infinity}),

		// number of jobs the poll distributes to the workers
		// defaults to 200
		// decrease of less efficient but more fair distribution
		poolParallelJobs: 50,

		// name of the pool
		// can be used to create different pools with otherwise identical options
		// name: 'my-pool',
	};

	if (!threadLoader) {
		threadLoader = require(loader);
		threadLoader.warmup(options, [
			'babel-loader',
			require.resolve('./babel.config.js')
		]);
	}


	return {
		loader,
		options,
	};
};
