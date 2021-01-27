'use strict';
const {find, resolve} = require('@nti/eslint-config-lib-scripts/resolve');
const {IN_WEBPACK} = require('@nti/eslint-config-lib-scripts/vars');

function getReactVersion () {
	try {
		return require('react/package.json').version;
	} catch (e) {
		return '16.2.0';
	}
}

module.exports = {
	extends: [
		'@nti/eslint-config-lib-scripts',
		'plugin:react/recommended'
	],

	settings: {
		'import/extensions': ['.js', '.mjs', '.jsx'],
		'import/resolver': {
			[require.resolve('./node-query-resolver')]: {
				'extensions': ['.js', '.mjs', '.jsx'],
				'moduleDirectory': [
					'node_modules',
					'src/main/js'
				]
			}
		},
		'react': {
			pragma: 'React',
			version: getReactVersion()
		}
	},

	globals: {
		// '$AppConfig': 'readonly',

		//Global Template Literal Tags:
		'css': 'readonly',
		'styled': 'readonly'
	},

	rules: {
		'import/no-extraneous-dependencies': [IN_WEBPACK ? 'off' : 'error', {
			'bundledDependencies': true,
			'devDependencies': true,
			'packageDir': [
				'.',
				find('package.json'),
				resolve('@nti/app-scripts'),
				resolve('@nti/cmp-scripts'),
				resolve('@nti/lib-scripts'),
			].filter(Boolean)
		}],

		//We standardize on using double quotes on JSX props since they look like HTML attributes.
		//See: http://eslint.org/docs/rules/jsx-quotes
		'jsx-quotes': ['warn', 'prefer-double'],

		'react/no-children-prop': ['off'],
		'react/no-deprecated': ['warn'],
		'react/no-typos': ['error'],
		'react/destructuring-assignment': ['off'],

		//See: https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-pascal-case.md
		'react/jsx-pascal-case': ['warn', { 'allowAllCaps': true }],

		// This is NOT an error.
		'react/display-name': ['off'],

		// Do not require prop-type validation for very common props provided by the system.
		'react/prop-types': ['warn', { ignore: ['children', 'className'], skipUndeclared: true}],

		//JSX should always be wrapped in parentheses... especially when multiline.
		//See: https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/wrap-multilines.md
		'react/jsx-wrap-multilines': ['warn', {
			'declaration': 'parens-new-line',
			'assignment': 'parens-new-line',
			'return': 'parens-new-line',
			'arrow': 'parens-new-line',
			'condition': 'parens-new-line',
			'logical': 'parens-new-line',
			'prop': 'parens-new-line'
		}]
	}
};
