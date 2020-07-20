'use strict';
const call = require('@nti/lib-scripts/tasks/utils/call-cmd');
const { SSL } = require('@nti/dev-ssl-config');
const paths = require('../config/paths');

const host = '0.0.0.0';
const port = 8000;

call(require.resolve('webpack-dev-server/bin/webpack-dev-server.js'), [
	'-d',
	'--history-api-fallback',
	'--config', paths.webpackDevConfig,
	'--host', host,
	'--port', port,
	'--watch',
	'--inline',
	...SSL
]);