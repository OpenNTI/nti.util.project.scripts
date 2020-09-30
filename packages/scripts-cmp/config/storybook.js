'use strict';
const WebpackConfig = require('./webpack.config.js');

module.exports = {
	'stories': [
		'../src/**/*.stories.mdx',
		'../src/**/*.stories.js'
	],
	'addons': [
		'@storybook/addon-links',
		'@storybook/addon-essentials'
	],

	webpackFinal: (config) => ({
		...config,
		resolve: {
			...config.resolve,
			alias: {
				...config.resolve.alias,
				...WebpackConfig.resolve.alias
			}
		},
		module: {
			...config.module,
			rules: WebpackConfig.module.rules
		},
		plugins: [
			...config.plugins,
		]
	})
};
