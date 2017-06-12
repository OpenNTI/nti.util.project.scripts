'use strict';
const paths = require('./paths');

module.exports = {
	'extends': [
		'nti-codestyle-jsx'
	],

	'settings': {
		'import/resolver': {
			'webpack': {
				'config': {
					'resolve': {
						'modules': [
							'node_modules',
							paths.appModules,
						],
						'extensions': ['.js', '.jsx']
					}
				}
			}
		}
	},

	'parser': 'babel-eslint'
};
