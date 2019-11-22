/*eslint strict:0, import/no-commonjs:0, import/no-extraneous-dependencies:0*/
'use strict';
const {worker} = require('cluster');
const readline = require('readline');
const path = require('path');
const url = require('url');
const { HTTPS, getHTTPS } = require('@nti/dev-ssl-config');

function clearLine (n) {
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

const ensureArray = x => Array.isArray(x) ? x : [x];

exports.setupDeveloperMode = async function setupDeveloperMode (config) {
	for(let n of ['info', 'log', 'debug']) { clearLine(n); }
	const getPort = require('get-port');
	const webpack = require('webpack');
	const WebpackServer = require('webpack-dev-server');

	const paths = require('../../config/paths');
	const [clientConfig,serverConfig] = ensureArray(require('../../config/webpack.config'));

	const {debug = false, server} = config;

	const domain = url.parse(paths.publicUrl).hostname || 'localhost';
	const api = url.parse(server);

	// eslint-disable-next-line no-unused-vars
	const apiPort = api.port, apiHost = api.hostname || 'localhost';


	const devPort = config['webpack-dev-server'] || await getPort();

	clientConfig.output.path = '/';
	clientConfig.output.publicPath = config.basepath;


	if (devPort !== 0 && HTTPS) {
		for (let entry of Object.keys(clientConfig.entry)) {
			const e = clientConfig.entry[entry];
			e.unshift(`webpack-dev-server/client?http://${domain}:${devPort}`);
		}
	}

	const serverBundleCompiler =  serverConfig && webpack({
		...serverConfig,
	});
	const serverBundleWatcher = serverBundleCompiler && serverBundleCompiler.watch({
		// watch options
	}, (err, stats) => {});

	const webpackServer = new WebpackServer(webpack(clientConfig), {
		allowedHosts: ['.dev', '.local', '.localhost'],
		hot: true,
		hotOnly: true,
		// This proxy will only work from the direct dev-server port. Only used for debugging.
		// proxy: {
		// 	'*': `http://${apiHost}:${apiPort}/`
		// },

		// Webpack Dev Server gets confused when setting this... content is served from memory.
		// The output.publicPath covers us here.
		// publicPath: config.basepath,

		https: getHTTPS(),
		compress: true,
		contentBase: paths.assetsRoot,
		public: `localhost:${devPort}`,
		overlay: {
			errors: true,
			warnings: false,
		},

		stats: {
			version: debug,
			hash: debug,
			timings: debug,

			assets: false,

			chunks: false,
			chunkModules: false,
			chunkOrigins: false,

			modules: false,
			children: false,

			colors: true,
			reasons: debug,
			errorDetails: true,
			entrypoints: false,
		}
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
		}
	};
};
