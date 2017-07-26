/*eslint strict:0, import/no-commonjs:0, import/no-extraneous-dependencies:0*/
'use strict';
const {worker} = require('cluster');

const first = x => Array.isArray(x) ? x[0] : x;

exports.setupDeveloperMode = function setupDeveloperMode (config) {
	const webpack = require('webpack');
	// const paths = require('../../config/paths');
	const webpackConfigFile = require('../../config/webpack.config');

	const WebpackServer = require('webpack-dev-server');

	const {debug = false, port} = config;
	const devPort = config['webpack-dev-server'] || 0;

	const webpackConfig = Object.assign({}, first(webpackConfigFile));

	webpackConfig.output.path = '/';
	webpackConfig.output.publicPath = config.basepath;
	webpackConfig.output.filename = 'js/[name].js';

	const compiler = webpack(webpackConfig);

	const webpackServer = new WebpackServer(compiler, {
		//hot: true,
		proxy: {
			'*': '//localhost:' + port
		},

		clientLogLevel: 'none',

		overlay: true,

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
					console.error(err);
				}

				console.info('WebPack Dev Server Started');
			});

			worker.on('disconnect', () => {
				console.info('Shutting down Webpack Dev Server');
				webpackServer.close();
			});
		}
	};
};
