'use strict';

const browsers = require('./browserlist');

const env = process.env.BABEL_ENV || process.env.NODE_ENV;

module.exports = function (api, opts) {
	const isTest = (env === 'test');
	return {
		sourceType: 'unambiguous',
		compact: false,
		presets: [
			['@babel/preset-env', {
				...((opts || {})['@babel/preset-env'] || {}),
				shippedProposals: true,
				targets: isTest ? {
					node: 'current'
				} : {
					browsers
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
