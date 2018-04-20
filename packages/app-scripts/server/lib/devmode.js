/*eslint strict:0, import/no-commonjs:0, import/no-extraneous-dependencies:0*/
'use strict';
const {worker} = require('cluster');
const fs = require('fs');
const url = require('url');
const path = require('path');

const first = x => Array.isArray(x) ? x[0] : x;

const {NTI_BUILDOUT_PATH = false} = process.env;

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

	const webpackConfig = Object.assign({}, first(webpackConfigFile));

	webpackConfig.output.path = '/';
	webpackConfig.output.publicPath = config.basepath;

	if (devPort !== 0 && NTI_BUILDOUT_PATH) {
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

		https: NTI_BUILDOUT_PATH && {
			cert: fs.readFileSync(path.join(NTI_BUILDOUT_PATH, 'etc/pki/localhost.crt')),
			key: fs.readFileSync(path.join(NTI_BUILDOUT_PATH, 'etc/pki/localhost.key'))
		},
		contentBase: paths.assetsRoot,
		overlay: NTI_BUILDOUT_PATH && {
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

	const template = webpackConfig.plugins.find(x => x.constructor.name === 'HtmlWebpackPlugin');

	return {
		middleware: webpackServer.middleware,
		entry: webpackConfig.output.filename,
		template: template.options.filename,
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
