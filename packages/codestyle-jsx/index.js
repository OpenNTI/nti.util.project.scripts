'use strict';

function getReactVersion () {
	try {
		return require('react/package.json').version;
	} catch (e) {
		return '16.2.0';
	}
}

module.exports = {
	extends: [
		require.resolve('@nti/codestyle-js'),
		'plugin:react/recommended'
	],

	settings: {
		'import/extensions': ['.js', '.mjs', '.jsx'],
		'import/resolver': {
			'node': {
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

	rules: {
		'import/no-extraneous-dependencies': ['error', {'devDependencies': true}],

		//We standarize on using double quotes on JSX props since they look like HTML attributes.
		//See: http://eslint.org/docs/rules/jsx-quotes
		'jsx-quotes': ['warn', 'prefer-double'],

		'react/no-deprecated': ['warn'],
		'react/no-typos': ['error'],

		//See: https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-pascal-case.md
		'react/jsx-pascal-case': ['warn', { 'allowAllCaps': true }],

		//JSX should always be wrapped in parentheses... especically when multiline.
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
