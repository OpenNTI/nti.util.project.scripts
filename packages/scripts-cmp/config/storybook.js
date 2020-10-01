'use strict';
const webpack = require('webpack');
const CommonWebpackConfig = require('./webpack.config.js');

module.exports = {
	'stories': [
		'../src/**/*.stories.mdx',
		'../src/**/*.stories.js'
	],
	'addons': [
		'@storybook/addon-links',
		'@storybook/addon-essentials'
	],

	webpackFinal: (storybookConfig) => ({
		...storybookConfig,
		resolve: {
			...storybookConfig.resolve,
			alias: {
				...storybookConfig.resolve.alias,
				...CommonWebpackConfig.resolve.alias
			}
		},
		module: {
			...storybookConfig.module,
			rules: CommonWebpackConfig.module.rules
		},
		devServer: {
			...storybookConfig.devServer,
			proxy: [
				...storybookConfig.devServer.proxy,
				...CommonWebpackConfig.devServer.proxy,
			]
		},
		plugins: [
			new webpack.DefinePlugin({
				$AppConfig: { server: '/dataserver2/' }
			}),
			...storybookConfig.plugins,
		]
	})
};
