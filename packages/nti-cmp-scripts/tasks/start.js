'use strict';
const call = require('nti-lib-scripts/tasks/utils/call-cmd');

const paths = require('../config/paths');

const host = '0.0.0.0';
const port = 8000;

//webpack-dev-server
//	-d
//	--config ./webpack.config.test.js
//	--host 0.0.0.0
//	--port 8000
//	--quiet
//	--watch
//	--progress
//	--inline

call('webpack-dev-server', [
	'-d',
	'--config', paths.webpackDevConfig,
	'--host', host,
	'--port', port,
	'--quiet',
	'--watch',
	// '--progress',
	'--inline'
]);
