'use strict';
const browsers = require('@nti/lib-scripts/config/browserlist');

const env = process.env.BABEL_ENV || process.env.NODE_ENV;

const base = {
	'compact': false,
	'sourceMaps': 'both',
};

if (env === 'test') {
	module.exports = Object.assign(base, {
		'plugins': ['transform-decorators-legacy'],
		'presets': [
			['env', {
				'useBuiltIns': true,
				'targets': {
					'node': 'current'
				}
			}],
			'stage-1',
			'react'
		]
	});
}
else {
	module.exports = Object.assign(base, {
		'presets': [
			['env', {
				'useBuiltIns': true,
				'modules': false,
				'targets': {
					browsers
				},
			}],
			'stage-1',
			'react'
		],
		'plugins': [
			'transform-decorators-legacy',
			'transform-runtime'
		]
	});
}

if (env === 'development' || env === 'test') {
	// The following two plugins are currently necessary to make React warnings
	// include more valuable information. They are included here because they are
	// currently not enabled in babel-preset-react. See the below threads for more info:
	// https://github.com/babel/babel/issues/4702
	// https://github.com/babel/babel/pull/3540#issuecomment-228673661
	// https://github.com/facebookincubator/create-react-app/issues/989
	module.exports.plugins.push(
		// Adds component stack to warning messages
		require.resolve('babel-plugin-transform-react-jsx-source'),
		// Adds __self attribute to JSX which React will use for some warnings
		require.resolve('babel-plugin-transform-react-jsx-self')
	);
}
