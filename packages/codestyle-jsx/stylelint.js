'use strict';

module.exports = {
	'extends': 'stylelint-config-standard',
	'rules': {
		'indentation': 'tab',
		'selector-list-comma-newline-after': null,
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
