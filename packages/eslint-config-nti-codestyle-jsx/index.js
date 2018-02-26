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
		'eslint-config-nti-codestyle-js',
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

		//Standarize on unary/valueless attributes for constant boolean props.
		//See: https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-boolean-value.md
		'react/jsx-boolean-value': 'warn',

		//Using bind() or arrow functions on props always trigger a prop-change.
		//See: https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-bind.md
		'react/jsx-no-bind': 'error',

		//See: https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-pascal-case.md
		'react/jsx-pascal-case': ['warn', { 'allowAllCaps': true }],

		//All child-less elements should self close. ex:  <div></div> should be <div/>
		//See: https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/self-closing-comp.md
		'react/self-closing-comp': 'error',

		//JSX should always be wrapped in parentheses... especically when multiline.
		//See: https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/wrap-multilines.md
		'react/jsx-wrap-multilines': ['error', {declaration: true, assignment: true, return: true}]
	}
};
