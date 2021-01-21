'use strict';

module.exports = {
	'extends': [
		'stylelint-config-standard',
		'stylelint-config-css-modules',
	],
	'rules': {
		'indentation': 'tab',
		'selector-type-no-unknown': null,
		'no-descending-specificity': null,
		'selector-list-comma-newline-after': null,
		'declaration-block-single-line-max-declarations': 3,
		'max-empty-lines': null,
		'at-rule-no-unknown': [true, {
			'ignoreAtRules': [
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
			]
		}]
	}
};
