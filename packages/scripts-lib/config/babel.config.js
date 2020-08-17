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
			['@babel/plugin-proposal-class-properties', { loose: true }],

			// I'm still hoping this makes it into the language, but if it doesn't get
			// traction by years end, I plan to remove it. (by Jan/Feb 2021)
			['@babel/plugin-proposal-export-default-from']
		]
	};
};
