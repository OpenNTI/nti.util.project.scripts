'use strict';

module.exports = {
	'extends': 'stylelint-config-standard',
	'rules': {
		'no-descending-specificity': false,
		'indentation': 'tab',
		'selector-list-comma-newline-after': null,
		'selector-pseudo-class-no-unknown': [true, {
			ignorePseudoClasses: [
				'global' // css modules use :global to break out of selector uglification
			]
		}],
		'at-rule-no-unknown': [true, {
			'ignoreAtRules': [
				'at-root',
				'each',
				'for',
				'function',
				'if',
				'include',
				'mixin'
			]
		}]
	}
};
