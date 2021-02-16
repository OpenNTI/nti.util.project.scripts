'use strict';

module.exports = function (api, opts) {
	api.cache.using(() => process.env.NODE_ENV);

	const env = { ...(opts || {})['@babel/preset-env'] };

	return {
		sourceType: 'unambiguous',
		compact: false,
		presets: [
			[
				'@babel/preset-env',
				{
					shippedProposals: true,
					corejs: env.useBuiltIns
						? { version: 3, proposals: true }
						: void 0,
					targets: {
						node: 'current',
					},
					...env,
				},
			],
			['@babel/preset-flow'],
		],
		plugins: [
			// These are added because its not included when the target is node=current?
			'@babel/plugin-proposal-class-properties',
			'@babel/plugin-proposal-private-methods',
		],
	};
};
