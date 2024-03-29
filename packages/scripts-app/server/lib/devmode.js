/*eslint strict:0, import/no-commonjs:0, import/no-extraneous-dependencies:0*/
'use strict';
const { globalAgent } = require('https');
const { worker } = require('cluster');
const readline = require('readline');

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

exports.setupDeveloperMode = async function setupDeveloperMode(
	config,
	expressApp
) {
	globalAgent.options.rejectUnauthorized = false;
	global.NTI_DevServer = true;

	if (config.webpack === false) {
		return;
	}

	const { getHTTPS } = await import('@nti/dev-ssl-config');
	for (let n of ['info', 'log', 'debug']) {
		clearLine(n);
	}

	const webpack = require('webpack');
	const WebpackServer = require('webpack-dev-server');

	const [clientConfig, serverConfig] = ensureArray(
		require('../../config/webpack.config')
	);

	// const {
	// 	debug = false,
	// } = config;

	// const domain = 'app.localhost';

	const devPort = await resolvePort(config);

	clientConfig.output.path = config.basepath;
	clientConfig.infrastructureLogging = {
		...clientConfig.infrastructureLogging,
		level: 'warn',
	};

	const https = await getHTTPS();

	const serverBundleCompiler =
		serverConfig &&
		webpack({
			...serverConfig,
		});
	const serverBundleWatcher = serverBundleCompiler?.watch(
		{
			// watch options
		},
		(err, stats) => {}
	);

	const webpackServer = new WebpackServer(
		{
			allowedHosts: 'all',

			https,
			host: '0.0.0.0',
			port: devPort,
			hot: false,
			liveReload: false,

			client: {
				logging: 'error',
				overlay: {
					errors: true,
					warnings: false,
				},
				progress: true,
			},

			devMiddleware: {
				index: true,
				// mimeTypes: { 'text/html': ['phtml'] },
				//
				publicPath: '/',
				// serverSideRender: true,
				// writeToDisk: true,

				// stats: {
				// 	preset: 'errors-only',

				// 	assets: false,
				// 	children: false,
				// 	chunkModules: false,
				// 	chunkOrigins: false,
				// 	chunks: false,
				// 	colors: true,
				// 	entrypoints: false,
				// 	errorDetails: true,
				// 	hash: debug,
				// 	modules: false,
				// 	moduleTrace: true,
				// 	reasons: debug,
				// 	timings: true,
				// 	version: true,
				// },
			},

			static: false /*{
				directory: paths.assetsRoot,
				staticOptions: {},
				// Don't be confused with `devMiddleware.publicPath`, it is `publicPath` for static directory
				publicPath: paths.servedPath,
				serveIndex: true,
				watch: true,
			},*/,
		},
		webpack(clientConfig)
	);

	try {
		await webpackServer.start();
	} catch (err) {
		console.error(err);
		process.exit(1);
	}

	//serve in-memory compiled sources/assets
	expressApp.use(webpackServer.middleware);

	worker.on('disconnect', async () => {
		console.info('Shutting down Webpack Dev Server');
		await webpackServer.stop();
		serverBundleWatcher?.close();
	});

	return {
		entry: clientConfig.output.filename,
		template: clientConfig[Symbol.for('template temp file')],
	};
};

async function resolvePort(config) {
	const cfg = config['webpack-dev-server'];
	let port;
	try {
		// require in try block so existing workspaces do not blow up
		const getPort = require('get-port');
		port = cfg || (await getPort());
	} catch {
		port = 'auto';
	}

	if (port === config.port) {
		throw new Error(
			'webpack-dev-server port must be different than the main port'
		);
	}

	return port;
}
