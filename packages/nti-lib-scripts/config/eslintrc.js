'use strict';

module.exports = {
	extends: [
		require.resolve('eslint-config-nti-codestyle-js')
	],

	env: {
		browser: false
	},

	'parser': 'babel-eslint'
};
