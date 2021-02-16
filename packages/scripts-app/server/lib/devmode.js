/*eslint strict:0, import/no-commonjs:0, import/no-extraneous-dependencies:0*/
'use strict';
const { globalAgent } = require('https');
const { worker } = require('cluster');
const readline = require('readline');
const { getHTTPS } = require('@nti/dev-ssl-config');

function clearLine(n) {
	const fn = console[n] || console.debug;
	console[n] = (...args) => {
		const [first] = args;
		readline.clearLine(process.stderr, 0);
		if (typeof first === 'string') {
			args[0] = '\r' + first;
		}
		fn.call(console, ...args);
	};
}

const ensureArray = x => (Array.isArray(x) ? x : [x]);

exports.setupDeveloperMode = async function setupDeveloperMode(config) {
	for (let n of ['info', 'log', 'debug']) {
		clearLine(n);
	}
	const getPort = require('get-port');
	const webpack = require('webpack');
	const WebpackServer = require('webpack-dev-server');

	const paths = require('../../config/paths');
	const [clientConfig, serverConfig] = ensureArray(
		require('../../config/webpack.config')
	);

	const {
		debug = false,
		// server,
	} = config;

	// const domain = 'app.localhost';

	const devPort = config['webpack-dev-server'] || (await getPort());

	clientConfig.output.path = '/';
	clientConfig.output.publicPath = config.basepath;

	const https = await getHTTPS();
	globalAgent.options.rejectUnauthorized = false;

	if (devPort !== 0 && https) {
		for (let entry of Object.keys(clientConfig.entry)) {
			const e = clientConfig.entry[entry];
			e.unshift(`webpack-dev-server/client?http://0.0.0.0:${devPort}`);
		}
	}

	const serverBundleCompiler =
		serverConfig &&
		webpack({
			...serverConfig,
		});
	const serverBundleWatcher =
		serverBundleCompiler &&
		serverBundleCompiler.watch(
			{
				// watch options
			},
			(err, stats) => {}
		);

	const webpackServer = new WebpackServer(webpack(clientConfig), {
		allowedHosts: ['.dev', '.local', '.localhost'],
		// hot: true,
		// hotOnly: true,

		// Webpack Dev Server gets confused when setting this... content is served from memory.
		// The output.publicPath covers us here.
		// publicPath: config.basepath,

		injectClient: false,
		injectHot: false,
		liveReload: false,

		https,
		compress: true,
		contentBase: paths.assetsRoot,

		overlay: {
			errors: true,
			warnings: false,
		},
		logLevel: 'error',
		stats: {
			preset: 'errors-only',

			assets: false,
			children: false,
			chunkModules: false,
			chunkOrigins: false,
			chunks: false,
			colors: true,
			entrypoints: false,
			errorDetails: true,
			hash: debug,
			modules: false,
			moduleTrace: true,
			reasons: debug,
			timings: true,
			version: true,
		},
	});

	return {
		middleware: webpackServer.middleware,
		entry: clientConfig.output.filename,
		template: clientConfig[Symbol.for('template temp file')],
		start: () => {
			webpackServer.listen(devPort, 'localhost', err => {
				if (err) {
					console.error(err);
				}
			});

			worker.on('disconnect', () => {
				console.info('Shutting down Webpack Dev Server');
				webpackServer.close();
				if (serverBundleWatcher) {
					serverBundleWatcher.close();
				}
			});
		},
	};
};
