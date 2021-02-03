'use strict';

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
					node: 'current'
				},
				...env
			}],
			['@babel/preset-flow'],
		],
		plugins: [
			// The decorators proposal is dead as we knew it, I plan to remove this plugin
			// once all the usage of legacy decorators has been removed/converted.
			['@babel/plugin-proposal-decorators', { legacy: true }],
			// These two need to be put into loose mode for the decorator plugin
			['@babel/plugin-proposal-class-properties', { loose: true }],
			// This was added because its not included when the target is node=current?
			['@babel/plugin-proposal-private-methods', { loose: true }],

		]
	};
};
