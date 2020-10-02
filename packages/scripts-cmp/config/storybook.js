'use strict';
const webpack = require('webpack');
const CommonWebpackConfig = require('./webpack.config.js');

module.exports = {
	'stories': [
		'../src/**/*.stories.mdx',
		'../src/**/*.stories.js'
	],
	'addons': [
		'@storybook/addon-actions',
		'@storybook/addon-controls',
		'@storybook/addon-essentials',
		'@storybook/addon-links',
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
