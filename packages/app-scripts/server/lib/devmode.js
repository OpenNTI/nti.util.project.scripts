/*eslint strict:0, import/no-commonjs:0, import/no-extraneous-dependencies:0*/
'use strict';
const {worker} = require('cluster');
const readline = require('readline');
const url = require('url');
const { HTTPS, getHTTPS } = require('@nti/dev-ssl-config');


const first = x => Array.isArray(x) ? x[0] : x;

exports.setupDeveloperMode = async function setupDeveloperMode (config) {
	const webpack = require('webpack');
	const paths = require('../../config/paths');
	const webpackConfigFile = require('../../config/webpack.config');
	const getPort = require('get-port');

	const WebpackServer = require('webpack-dev-server');

	const {debug = false, server} = config;

	const domain = url.parse(paths.publicUrl).hostname || 'localhost';
	const api = url.parse(server);
	const apiHost = api.hostname || 'localhost';
	const apiPort = api.port;

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
		allowedHosts: ['.dev', '.local'],
		disableHostCheck: true,
		hot: true,
		hotOnly: true,
		proxy: {
			'*': `http://${apiHost}:${apiPort}/`
		},

		https: HTTPS && getHTTPS(),
		contentBase: paths.assetsRoot,
		overlay: {
			errors: true,
			warnings: false,
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

			colors: true,
			reasons: true,
			errorDetails: true
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

				readline.clearLine(process.stdout,0);
				console.info('\rWebPack Dev Server Started');
			});

			worker.on('disconnect', () => {
				console.info('Shutting down Webpack Dev Server');
				webpackServer.close();
			});
		}
	};
};
