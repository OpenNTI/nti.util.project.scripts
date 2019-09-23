'use strict';
const baseConfig = require('@nti/lib-scripts/config/babel.config');

const env = process.env.BABEL_ENV || process.env.NODE_ENV;
const dev = (!env || env === 'development' || env === 'test');

module.exports = function (api, opts) {
	const base = baseConfig(api, {
		...opts,
		'@babel/preset-env': {
			corejs: { version: 3, proposals: true },
			useBuiltIns: 'entry',
			targets: env === 'test' ? {
				node: 'current'
			} : {
				browsers: require('@nti/lib-scripts/config/browserlist')
			}
		}
	});

	return {
		...base,
		'presets': [
			...base.presets,
			['@babel/preset-react', { development: dev }],
		],
		'plugins': [
			!dev && '@babel/plugin-transform-runtime',
			...base.plugins
		].filter(Boolean)
	};
};
