'use strict';

module.exports = {
	extends: [
		'stylelint-config-standard',
		'stylelint-config-css-modules',
		'stylelint-config-prettier',
	],
	rules: {
		'at-rule-no-unknown': [
			true,
			{
				ignoreAtRules: [
					'at-root',
					'each',
					'else',
					'extend',
					'for',
					'function',
					'if',
					'include',
					'mixin',
					'value',
				],
			},
		],
		'declaration-block-single-line-max-declarations': 3,
		'max-empty-lines': null,
		'no-descending-specificity': null,
		'selector-list-comma-newline-after': null,
		'selector-type-no-unknown': null,
	},
};
