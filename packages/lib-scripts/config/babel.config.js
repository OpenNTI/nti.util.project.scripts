'use strict';
const {isCI} = require('ci-info');

module.exports = function (api, opts) {
	if (api && api.cache) {
		api.cache(() => process.env.NODE_ENV);
	}

	return {
		sourceType: 'unambiguous',
		compact: false,
		presets: [
			['@babel/preset-env', {
				...((opts || {})['@babel/preset-env'] || {}),
				shippedProposals: true,
				targets: {
					node: isCI
						? '8.9.4' //just in case the build server's node is newer than PROD
						: 'current'
				},
			}],
			['@babel/preset-flow'],
		],
		plugins: [
			['@babel/plugin-proposal-decorators', { legacy: true }],
			['@babel/plugin-proposal-class-properties', { loose: true }],
			['@babel/plugin-proposal-export-default-from'],
			['@babel/plugin-proposal-export-namespace-from'],
			['@babel/plugin-syntax-dynamic-import'],
		].filter(Boolean)
	};
};
