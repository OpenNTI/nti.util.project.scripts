'use strict';
const {isCI} = require('ci-info');

module.exports = function (api, opts) {
	api.cache.using(() => process.env.NODE_ENV);

	const env = { ...(opts || {})['@babel/preset-env'] };

	return {
		sourceType: 'unambiguous',
		compact: false,
		presets: [
			['@babel/preset-env', {
				loose: true,
				shippedProposals: true,
				corejs: env.useBuiltIns ? { version: 3, proposals: true } : void 0,
				targets: {
					node: isCI
						? '8.9.4' //just in case the build server's node is newer than PROD
						: 'current'
				},
				...env
			}],
			['@babel/preset-flow'],
		],
		plugins: [
			['@babel/plugin-proposal-decorators', { legacy: true }],
			['@babel/plugin-proposal-class-properties', { loose: true }],
			['@babel/plugin-proposal-export-default-from'],
			['@babel/plugin-proposal-export-namespace-from'],

			// Stage 3, will be in @babel/preset-env soon...babel itself already uses these.
			// Defining plugins twice is a harmless noop. Will clean these out once babel adds
			// them to the main preset.
			['@babel/plugin-proposal-optional-chaining'],
			['@babel/plugin-proposal-nullish-coalescing-operator'],

			['@babel/plugin-syntax-dynamic-import'],
		]
	};
};
