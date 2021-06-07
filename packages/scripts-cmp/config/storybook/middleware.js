'use strict';

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function expressMiddleware(router) {
	router.use(
		'/dataserver2',
		createProxyMiddleware({
			target: 'https://app.localhost',
			changeOrigin: true,
			secure: false,
		})
	);
};
