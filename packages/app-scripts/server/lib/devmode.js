/*eslint strict:0, import/no-commonjs:0, import/no-extraneous-dependencies:0*/
'use strict';
const {worker} = require('cluster');
const readline = require('readline');
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

const first = x => Array.isArray(x) ? x[0] : x;

exports.setupDeveloperMode = async function setupDeveloperMode (config) {
	for(let n of ['info', 'log', 'debug']) { clearLine(n); }
	const webpack = require('webpack');
	const paths = require('../../config/paths');
	const webpackConfigFile = require('../../config/webpack.config');
	const getPort = require('get-port');

	const WebpackServer = require('webpack-dev-server');

	const {debug = false, server} = config;

	const domain = url.parse(paths.publicUrl).hostname || 'localhost';
	const api = url.parse(server);

	// eslint-disable-next-line no-unused-vars
	const apiPort = api.port, apiHost = api.hostname || 'localhost';

	const devPort = config['webpack-dev-server'] || await getPort();

	const webpackConfig = { ...first(webpackConfigFile)};

	webpackConfig.output.path = '/';
	webpackConfig.output.publicPath = config.basepath;


	if (devPort !== 0 && HTTPS) {
		for (let entry of Object.keys(webpackConfig.entry)) {
			const e = webpackConfig.entry[entry];
			e.unshift(`webpack-dev-server/client?http://${domain}:${devPort}`);
		}
	}

	const compiler = webpack(webpackConfig);

	const webpackServer = new WebpackServer(compiler, {
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
		https: HTTPS && getHTTPS(),
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
		entry: webpackConfig.output.filename,
		template: webpackConfig[Symbol.for('template temp file')],
		start: () => {
			webpackServer.listen(devPort, 'localhost', err => {
				if (err) {
					console.error(err);
				}
			});

			worker.on('disconnect', () => {
				console.info('Shutting down Webpack Dev Server');
				webpackServer.close();
			});
		}
	};
};
