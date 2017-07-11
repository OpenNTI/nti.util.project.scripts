'use strict';
// const paths = require('./paths');

module.exports = {
	'extends': [
		'nti-codestyle-jsx'
	],

	'settings': {
		'import/extensions': ['.js', '.jsx', '.async.jsx'],
		'import/resolver': {
			'node': {
				'extensions': ['.js', '.jsx', '.async.jsx'],
				'moduleDirectory': [
					'node_modules',
					'src/main/js'
				]
			}
		}
	},

	'parser': 'babel-eslint'
};
