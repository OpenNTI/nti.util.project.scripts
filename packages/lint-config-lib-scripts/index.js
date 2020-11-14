'use strict';
const IN_ATOM = 'ATOM_HOME' in process.env;
const IN_VSCODE = 'VSCODE_PID' in process.env;
const IN_IDE = IN_ATOM || IN_VSCODE;
const PROD = process.env.NODE_ENV === 'production';

// Lint only runs on webpack in dev mode
const DEV = PROD ? false : (IN_IDE || !!process.env.__IN_WEBPACK);

// The ESLint browser environment defines all browser globals as valid,
// even though most people don't know some of them exist (e.g. `name` or `status`).
// This is dangerous as it hides accidentally undefined variables.
// We blacklist the globals that we deem potentially confusing.
// To use them, explicitly reference them, e.g. `window.name` or `window.status`.
const restrictedGlobals = [
	'addEventListener',
	'blur',
	'close',
	'closed',
	'confirm',
	'defaultStatus',
	'defaultstatus',
	'event',
	'external',
	'find',
	'focus',
	'frameElement',
	'frames',
	'history',
	'innerHeight',
	'innerWidth',
	'length',
	'location',
	'locationbar',
	'menubar',
	'moveBy',
	'moveTo',
	'name',
	'onblur',
	'onerror',
	'onfocus',
	'onload',
	'onresize',
	'onunload',
	'open',
	'opener',
	'opera',
	'outerHeight',
	'outerWidth',
	'pageXOffset',
	'pageYOffset',
	'parent',
	'print',
	'removeEventListener',
	'resizeBy',
	'resizeTo',
	'screen',
	'screenLeft',
	'screenTop',
	'screenX',
	'screenY',
	'scroll',
	'scrollbars',
	'scrollBy',
	'scrollTo',
	'scrollX',
	'scrollY',
	'self',
	'status',
	'statusbar',
	'stop',
	'toolbar',
	'top',

	//block deprecated jasmine globals
	'it',
	'xit',
	'fit',
	'fdescribe',
	'xdescribe',
];

module.exports = {
	extends: 'eslint:recommended',
	parser: '@babel/eslint-parser',
	parserOptions: {
		ecmaVersion: new Date().getFullYear(),
		sourceType: 'module',
		ecmaFeatures: {
			legacyDecorators: true,
			impliedStrict: true,
			globalReturn: false
		}
	},

	settings: {
		'import/extensions': ['.js', '.mjs'],
		'import/resolver': {
			'node': {
				'extensions': ['.js', '.mjs'],
				'moduleDirectory': [
					'node_modules'
				]
			}
		}
	},

	env: {
		es6: true,
		node: true,
		browser: true
	},

	plugins: [
		'@babel',
		'import'
	],

	rules: {
		'camelcase': ['error', {'properties': 'always'}],
		'curly': ['error', 'all'],
		'eqeqeq': ['error', 'allow-null'],
		'guard-for-in': 'error',
		'indent': ['error', 'tab'],
		'no-caller': 'error',
		'no-console': 'warn',
		'no-debugger': IN_IDE ? 'off' : (DEV ? 'warn' : 'error'),
		'no-multiple-empty-lines': ['warn', {'max': 3, 'maxBOF': 3, 'maxEOF': 1}],
		'no-new': 'error',
		'no-prototype-builtins': 'warn',
		'no-restricted-globals': ['error'].concat(restrictedGlobals),
		'no-restricted-modules': ['warn', {
			'paths':[{
				'name': 'classnames/bind',
				'message': 'This usage can lead to accidental css-module mapping.'
			},{
				'name': 'url',
				'message': 'Use the global `URL` instead.'
			}],
		}],
		'no-shadow': ['warn', {'builtinGlobals': false, 'hoist': 'never', 'allow': ['done']}],
		'no-throw-literal': 'error',
		'no-unused-vars': [DEV ? 'warn' : 'error', {'ignoreRestSiblings': true, 'args': 'none'}],
		'no-use-before-define': ['error', 'nofunc'],
		'no-var': 'error',
		'prefer-object-spread': 'warn',
		'quotes': ['warn', 'single'],
		'radix': 'error',
		'require-atomic-updates': (PROD || IN_IDE) ? 'warn' : 'off',
		'semi': 'error',
		// 'sort-imports': ['warn', {
		// 	'ignoreCase': false,
		// 	'ignoreDeclarationSort': true,
		// 	'ignoreMemberSort': false,
		// 	'memberSyntaxSortOrder': ['none', 'all', 'multiple', 'single'],
		// 	'allowSeparatedGroups': true
		// }],
		'space-before-blocks': ['warn', 'always'],
		'space-before-function-paren': ['warn', {'anonymous': 'always', 'named': 'always'}],
		'space-infix-ops': ['error', {'int32Hint': true}],
		'space-unary-ops': ['warn', { 'words': true, 'nonwords': false }],
		'strict': ['error', 'never'],
		'valid-jsdoc': 'warn',
		'wrap-iife': ['error', 'any'],

		'import/no-duplicates': 'warn',
		'import/no-extraneous-dependencies': ['error', {
			'bundledDependencies': true,
			'devDependencies': ['**/test/*.js', '**/*.spec.js',  '**/*.stories.js']
		}],
		// 'import/no-unresolved': ['error', {'commonjs': true}],
		'import/order': ['warn', {
			'newlines-between': 'always',
			'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'unknown', 'object'],
			// 'alphabetize': {
			// 	'order': 'asc',
			// 	'caseInsensitive': true
			// }
		}],
		'import/no-amd': 'error',
		'import/no-commonjs': 'error',
		'import/no-webpack-loader-syntax': 'error'
	}
};
