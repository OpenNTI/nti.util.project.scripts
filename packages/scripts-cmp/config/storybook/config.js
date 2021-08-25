'use strict';
const fs = require('fs');
const path = require('path');
const { sync: glob } = require('glob');

const paths = require('../paths');
const [CommonWebpackConfig] = require('@nti/app-scripts/config/webpack.config');

const {
	plugins: jsPlugins,
	loaders: jsLoaders,
} = require('@nti/app-scripts/config/js-loaders');
const {
	plugins: cssPlugins,
	loaders: cssLoaders,
} = require('@nti/app-scripts/config/css-loaders');

function find(file, limit = 4) {
	const abs = path.resolve(file);
	const atRoot = path.resolve(path.join('..', file)) === abs;

	const result = glob(abs);

	if (result.length > 0) {
		return result.length > 1 ? result : result[0];
	}

	return limit <= 0 || atRoot ? null : find(path.join('..', file), limit - 1);
}

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

function loadAuthorization() {
	let auth = null;
	try {
		const authLocation = find('.storybook.auth');
		if (!authLocation) {
			return;
		}
		auth = fs.readFileSync(authLocation).toString('base64');
		auth = `Basic ${auth}`;
	} catch {
		//
	}

	return { DEV_DATA_SERVER_AUTH: JSON.stringify(auth) };
}

module.exports = {
	core: {
		builder: 'webpack5',
	},
	stories: ['../src/**/*.stories.@(js|mdx)'],
	addons: [
		'@storybook/addon-docs',
		'@storybook/addon-actions',
		'@storybook/addon-controls',
		'@storybook/addon-essentials',
		'@storybook/addon-links',
		'@storybook/addon-a11y',
	],

	async babel(options) {
		return {
			babelrc: false,
			configFile: false,
			presets: [paths.resolveApp('babel.config.cjs')],
		};
	},

	webpackFinal(storybookConfig) {
		storybookConfig.entry = getEntry(
			storybookConfig.entry,
			require.resolve('./globals')
		);

		// Add workspace aliases...
		Object.assign(
			storybookConfig.resolve.alias,
			CommonWebpackConfig.resolve.alias
		);

		storybookConfig.resolve.extensions = [
			...new Set([
				...CommonWebpackConfig.resolve.extensions,
				...storybookConfig.resolve.extensions,
			]),
		];

		Object.assign(
			storybookConfig.resolve.fallback ||
				(storybookConfig.resolve.fallback = {}),
			CommonWebpackConfig.resolve.fallback
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

		// add our js/css loaders
		rules.push(
			...jsLoaders(true),
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
			...jsPlugins({
				define: {
					...loadAuthorization(),
				},
			}),
			...cssPlugins({
				miniCssExtract: {
					filename: '[name]-[contenthash].css',
				},
			})
		);

		return storybookConfig;
	},
};
