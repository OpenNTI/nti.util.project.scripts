'use strict';
const {isCI} = require('ci-info');

module.exports = function (api, opts) {
	api.cache.using(() => process.env.NODE_ENV);

	return {
		sourceType: 'unambiguous',
		compact: false,
		presets: [
			['@babel/preset-env', {
				shippedProposals: true,
				targets: {
					node: isCI
						? '8.9.4' //just in case the build server's node is newer than PROD
						: 'current'
				},
				...(opts || {})['@babel/preset-env']
			}],
			['@babel/preset-flow'],
		],
		plugins: [
			['@babel/plugin-proposal-decorators', { legacy: true }],
			['@babel/plugin-proposal-class-properties', { loose: true }],
			['@babel/plugin-proposal-export-default-from'],
			['@babel/plugin-proposal-export-namespace-from'],
			['@babel/plugin-syntax-dynamic-import'],
		]
	};
};
