
const DEV = process.env.NODE_ENV !== 'production' || 'ATOM_HOME' in process.env;

// The ESLint browser environment defines all browser globals as valid,
// even though most people don't know some of them exist (e.g. `name` or `status`).
// This is dangerous as it hides accidentally undefined variables.
// We blacklist the globals that we deem potentially confusing.
// To use them, explicitly reference them, e.g. `window.name` or `window.status`.
var restrictedGlobals = [
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

	parserOptions: {
		ecmaVersion: 2017,
		sourceType: 'module',
		ecmaFeatures: {
			experimentalObjectRestSpread: true,
			impliedStrict: true,
			globalReturn: false
		}
	},

	env: {
		es6: true,
		node: true,
		browser: true
	},
	
	plugins: [
		'import'
	],

	rules: {
		'camelcase': ['error', {'properties': 'always'}],
		'curly': ['error', 'all'],
		'eqeqeq': ['error', 'allow-null'],
		'guard-for-in': 'error',
		'indent': ['error', 'tab'],
		'no-caller': 'error',
		'no-console': DEV ? 'warn' : 'error',
		'no-debugger': DEV ? 'warn' : 'error',
		'no-multiple-empty-lines': ['warn', {'max': 3, 'maxBOF': 3, 'maxEOF': 1}],
		'no-new': 'error',
		'no-restricted-globals': ['error'].concat(restrictedGlobals),
		'no-shadow': ['warn', {'builtinGlobals': false, 'hoist': 'never', 'allow': ['done']}],
		'no-throw-literal': 'error',
		'no-unused-vars': [DEV ? 'warn' : 'error', {"args": "none"}],
		'no-use-before-define': ['error', 'nofunc'],
		'no-var': 'error',
		'quotes': ['warn', 'single'],
		'radix': 'error',
		'semi': 'error',
		'space-before-blocks': ['warn', 'always'],
		'space-before-function-paren': ['warn', {'anonymous': 'always', 'named': 'always'}],
		'space-infix-ops': ['error', {'int32Hint': true}],
		'space-unary-ops': ['warn', { 'words': true, 'nonwords': false }],
		'strict': ['error', 'never'],
		'valid-jsdoc': 'warn',
		'wrap-iife': ['error', 'any'],
		
		'import/no-duplicates': 'warn',
		'import/no-extraneous-dependencies': ['error', {'devDependencies': ['**/test/*.js', '**/*.spec.js']}],
		'import/no-unresolved': ['error', {'commonjs': true}],
		'import/order': ['warn', {'newlines-between': 'always', 'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index']}],
		'import/no-amd': 'error',
		'import/no-commonjs': 'error',
		'import/no-webpack-loader-syntax': 'error'
	}
};
