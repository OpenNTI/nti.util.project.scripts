'use strict';

module.exports = {
	'extends': 'stylelint-config-standard',
	'rules': {
		'no-descending-specificity': null,
		'indentation': 'tab',
		'selector-list-comma-newline-after': null,
		'selector-pseudo-class-no-unknown': [true, {
			ignorePseudoClasses: [
				'global' // css modules use :global to break out of selector uglification
			]
		}],
		'declaration-block-single-line-max-declarations': 3,
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
				'mixin'
			]
		}]
	}
};
