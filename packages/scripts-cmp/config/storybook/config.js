'use strict';
const paths = require('../paths');
const CommonWebpackConfig = require('../webpack.config.js');
const {
	plugins: jsPlugins,
	loaders: jsLoaders,
} = require('@nti/app-scripts/config/js-loaders');
const {
	plugins: cssPlugins,
	loaders: cssLoaders,
} = require('@nti/app-scripts/config/css-loaders');

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
	core: {
		builder: 'webpack5',
	},
	stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.js'],
	addons: [
		'@storybook/addon-docs',
		'@storybook/addon-actions',
		'@storybook/addon-controls',
		'@storybook/addon-essentials',
		'@storybook/addon-links',
		'@storybook/addon-a11y',
	],

	webpackFinal: storybookConfig => {
		storybookConfig.entry = getEntry(
			storybookConfig.entry,
			require.resolve('./globals')
		);

		// Add workspace aliases...
		Object.assign(
			storybookConfig.resolve.alias,
			CommonWebpackConfig.resolve.alias
		);

		// Add dataserver proxy settings?
		Object.assign(
			storybookConfig.devServer?.proxy ?? {},
			CommonWebpackConfig.devServer.proxy
		);

		// Now this is the sticky part...
		let rules = storybookConfig.module.rules;

		// remove storybook's css loaders
		rules = rules.filter(x => !x.test.test('.css'));

		// remove storybook's js loaders
		rules = rules.filter(
			x =>
				!((x = x.test),
				x.test('.js') ||
					x.test('.jsx') ||
					x.test('.mdx') ||
					x.test('story.js') ||
					x.test('story.jsx') ||
					x.test('story.mdx') ||
					x.test('stories.js') ||
					x.test('stories.jsx') ||
					x.test('stories.mdx'))
		);

		// add our js/css loaders
		rules.push(
			...jsLoaders(true, storybookConfig),
			...cssLoaders(paths, {
				inline: true,
				sass: {
					sassOptions: {
						includePaths: [
							paths.resolveApp('src/main/resources/scss'),
						],
					},
				},
			})
		);

		storybookConfig.module.rules = rules;

		// Add our plugins...
		storybookConfig.plugins.unshift(
			...jsPlugins(),
			...cssPlugins({
				miniCssExtract: {
					filename: '[name]-[contenthash].css',
				},
			})
		);

		return storybookConfig;
	},
};
