'use strict';
const path = require('path');
const call = require('@nti/lib-scripts/tasks/utils/call-cmd');

const paths = require('../config/paths');

const host = '0.0.0.0';
const port = 8000;
const {NTI_BUILDOUT_PATH = false} = process.env;

const SSL = !NTI_BUILDOUT_PATH ? [] : [
	'--https',
	'--key', path.join(NTI_BUILDOUT_PATH, 'etc/pki/localhost.key'),
	'--cert', path.join(NTI_BUILDOUT_PATH, 'etc/pki/localhost.crt')
];

//webpack-dev-server
//	-d
//	--config ./webpack.config.test.js
//	--host 0.0.0.0
//	--port 8000
//	--quiet
//	--watch
//	--progress
//	--inline

call(require.resolve('webpack-dev-server/bin/webpack-dev-server.js'), [
	'-d',
	'--history-api-fallback',
	'--config', paths.webpackDevConfig,
	'--host', host,
	'--port', port,
	'--quiet',
	'--watch',
	// '--progress',
	'--inline',
	...SSL
]);
