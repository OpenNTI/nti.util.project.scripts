'use strict';
const { join } = require('path');
const fs = require('fs');
const { resolve, find } = require('./resolve');
const { DEV, IN_IDE } = require('./vars');
const configFile = join(
	__dirname,
	`config.${DEV ? 'dev' : 'prod'}${IN_IDE ? '.ide' : ''}.json`
);

try {
	module.exports = require(configFile);
	if (!DEV || fs.statSync(__filename).mtime > fs.statSync(configFile).mtime) {
		throw new Error('Recompute');
	}
} catch {
	const config = computeConfig();
	fs.writeFileSync(configFile, JSON.stringify(config, null, 2), {
		encoding: 'utf-8',
	});
	module.exports = config;
}

function computeConfig() {
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

	return {
		extends: ['eslint:recommended', 'prettier'],
		parser: '@babel/eslint-parser',
		parserOptions: {
			ecmaVersion: new Date().getFullYear(),
			sourceType: 'module',
			ecmaFeatures: {
				impliedStrict: true,
				globalReturn: false,
			},
		},

		settings: {
			'import/extensions': ['.js', '.mjs'],
			'import/internal-regex': '^(@nti|internal)\\/',
			'import/resolver': {
				node: {
					extensions: ['.js', '.mjs'],
					moduleDirectory: ['node_modules'],
				},
			},
		},

		env: {
			es6: true,
			node: true,
			browser: true,
		},

		plugins: ['@babel', 'import', 'prettier'],

		reportUnusedDisableDirectives: !DEV,
		rules: {
			// 'prettier/prettier': IN_IDE ? 'warn' : 'off',
			camelcase: [
				'warn',
				{
					properties: 'never',
					ignoreDestructuring: true,
					ignoreImports: true,
				},
			],
			curly: ['error', 'all'],
			eqeqeq: ['error', 'allow-null'],
			'guard-for-in': 'error',
			// indent: ['error', 'tab'],
			'no-caller': 'error',
			'no-console': 'warn',
			'no-debugger': IN_IDE ? 'off' : DEV ? 'warn' : 'error',
			'no-multiple-empty-lines': [
				'warn',
				{ max: 3, maxBOF: 3, maxEOF: 1 },
			],
			'no-new': 'error',
			'no-prototype-builtins': 'warn',
			'no-restricted-globals': ['error'].concat(restrictedGlobals),
			'no-restricted-modules': [
				'warn',
				{
					paths: [
						{
							name: 'classnames/bind',
							message:
								'This usage can lead to accidental css-module mapping.',
						},
						{
							name: 'url',
							message: 'Use the global `URL` instead.',
						},
					],
				},
			],
			'no-shadow': [
				'warn',
				{ builtinGlobals: false, hoist: 'never', allow: ['done'] },
			],
			'no-throw-literal': 'error',
			'no-unused-vars': [
				'error',
				{ ignoreRestSiblings: true, args: 'none' },
			],
			'no-use-before-define': ['error', 'nofunc'],
			'no-var': 'error',
			'prefer-object-spread': 'warn',
			quotes: [
				'warn',
				'single',
				{
					avoidEscape: true,
					allowTemplateLiterals: true,
				},
			],
			radix: 'error',
			'require-atomic-updates': DEV ? 'warn' : 'off',
			semi: 'error',
			// 'sort-imports': ['warn', {
			// 	'ignoreCase': false,
			// 	'ignoreDeclarationSort': true,
			// 	'ignoreMemberSort': false,
			// 	'memberSyntaxSortOrder': ['none', 'all', 'multiple', 'single'],
			// 	'allowSeparatedGroups': true
			// }],
			'space-before-blocks': ['warn', 'always'],
			// 'space-before-function-paren': [
			// 	'warn',
			// 	{ anonymous: 'always', named: 'always' },
			// ],
			'space-infix-ops': ['error', { int32Hint: true }],
			'space-unary-ops': ['warn', { words: true, nonwords: false }],
			strict: ['error', 'never'],
			'valid-jsdoc': [
				'error',
				{
					// Please follow https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
					// https://www.typescriptlang.org/docs/handbook/intro-to-js-ts.html
					prefer: {
						arg: 'param',
						argument: 'param',
						constructor: 'class',
						return: 'returns',
						virtual: 'abstract',
					},
					preferType: {
						Boolean: 'boolean',
						Number: 'number',
						object: 'Object',
						String: 'string',
					},
					requireParamDescription: false,
					requireReturnDescription: false,
				},
			],
			'wrap-iife': ['error', 'any'],

			'import/no-duplicates': 'warn',
			'import/no-extraneous-dependencies': !IN_IDE
				? 'off'
				: [
						'error',
						{
							bundledDependencies: true,
							devDependencies: [
								'**/test/*.js',
								'**/*.spec.js',
								'**/*.stories.js',
							],
							packageDir: [
								find('package.json'),
								resolve('@nti/lib-scripts'),
							].filter(Boolean),
						},
				  ],
			// 'import/no-unresolved': ['error', {'commonjs': true}],
			'import/order': !IN_IDE
				? 'off'
				: [
						'warn',
						{
							'newlines-between': 'always',
							groups: [
								'builtin',
								'external',
								'internal',
								'parent',
								'sibling',
								'index',
								'unknown',
								'object',
							],
							// 'alphabetize': {
							// 	'order': 'asc',
							// 	'caseInsensitive': true
							// }
						},
				  ],
			'import/no-amd': 'error',
			'import/no-commonjs': 'error',
			'import/no-webpack-loader-syntax': 'error',
		},
	};
}
