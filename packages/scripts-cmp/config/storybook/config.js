'use strict';
const CommonWebpackConfig = require('../webpack.config.js');

function getEntry(currentEntry, newEntry) {
    if (typeof currentEntry === 'string') {
        currentEntry = [currentEntry];
    }
    if (Array.isArray(currentEntry)) {
        return [newEntry, ...currentEntry];
    }
    for (const [key, val] of Object.entries(currentEntry)) {
        currentEntry[key] = getEntry(val, newEntry);
    }
    return currentEntry;
}

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
		entry: getEntry(storybookConfig.entry, require.resolve('./globals')),
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
				...(storybookConfig.devServer?.proxy ?? []),
				...CommonWebpackConfig.devServer.proxy,
			]
		},
		plugins: [
			...storybookConfig.plugins,
		]
	})
};
