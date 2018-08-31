'use strict';
const baseConfig = require('@nti/lib-scripts/config/babelrc');

const env = process.env.BABEL_ENV || process.env.NODE_ENV;
const dev = (!env || env === 'development' || env === 'test');

module.exports = function (context, opts) {
	const base = baseConfig(context, {
		...opts,
		'@babel/preset-env': {
			useBuiltIns: 'entry',
		}
	});

	return {
		...base,
		'presets': [
			...base.presets,
			['@babel/preset-react', { development: dev }],
		],
		'plugins': [
			// !dev && '@babel/plugin-transform-runtime',
			...base.plugins
		].filter(Boolean)
	};
};
