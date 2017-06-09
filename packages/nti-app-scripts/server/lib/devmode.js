/*eslint strict:0*/
'use strict';
const {worker} = require('cluster');

const logger = require('./logger');

const first = x => Array.isArray(x) ? x[0] : x;

exports.setupDeveloperMode = function setupDeveloperMode (config) {
	const webpack = require('webpack');
	const webpackConfigFile = require('../../../webpack.config');

	const WebpackServer = require('webpack-dev-server');

	const {debug = false, port} = config;
	const devPort = config['webpack-dev-server'] || 0;

	const webpackConfig = Object.assign({}, first(webpackConfigFile));

	webpackConfig.output.path = '/';
	webpackConfig.output.publicPath = config.basepath;
	webpackConfig.output.filename = 'js/[name].js';

	const webpackServer = new WebpackServer(webpack(webpackConfig), {
		//hot: true,
		proxy: {
			'*': '//localhost:' + port
		},

		noInfo: false,
		quiet: false,
		lazy: false,
		watchOptions: {
			aggregateTimeout: 5000
		},

		stats: {
			version: debug,
			hash: debug,
			timings: debug,

			assets: false,

			chunks: debug,
			chunkModules: false,
			chunkOrigins: false,

			modules: false,
			children: false,

			// cached: false,
			// cachedAssets: false,
			// showChildren: false,
			// source: false,

			colors: true,
			reasons: true,
			errorDetails: true
		}
	});


	return {
		middleware: webpackServer.middleware,
		entry: webpackConfig.output.filename,
		start: () => {
			webpackServer.listen(devPort, 'localhost', err => {
				if (err) {
					logger.error(err);
				}

				logger.info('WebPack Dev Server Started');
			});

			worker.on('disconnect', () => {
				logger.info('Shutting down Webpack Dev Server');
				webpackServer.close();
			});
		}
	};
};
