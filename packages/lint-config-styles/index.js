'use strict';

module.exports = {
	overrides: [
		{
			files: ['**/*.scss'],
			extends: [
				'stylelint-config-standard',
				'stylelint-config-standard-scss',
				'stylelint-config-prettier',
			],
			rules: {
				'color-function-notation': 'legacy',
			},
		},
		{
			files: ['**/*.html'],
			customSyntax: 'postcss-html',
			extends: ['stylelint-config-standard', 'stylelint-config-prettier'],
		},
		{
			files: ['**/*.css'],
			extends: [
				'stylelint-config-standard',
				'stylelint-config-css-modules',
				'stylelint-config-prettier',
			],
		},
		{
			files: [
				'**/*.js',
				'**/*.jsx',
				'**/*.ts',
				'**/*.tsx',
				'**/*.mjs',
				'**/*.cjs',
			],
			customSyntax: '@stylelint/postcss-css-in-js',
			extends: [
				'stylelint-config-standard',
				'stylelint-config-css-modules',
				'stylelint-config-prettier',
			],
		},
	],
	rules: {
		'no-invalid-position-at-import-rule': null,
		'custom-property-empty-line-before': null,
		'declaration-block-single-line-max-declarations': 3,
		'max-empty-lines': null,
		'no-descending-specificity': null,
		'selector-list-comma-newline-after': null,
		'selector-class-pattern': null,
		'selector-type-no-unknown': null,
	},
};
