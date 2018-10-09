'use strict';

module.exports = {
	'extends': 'stylelint-config-standard',
	'rules': {
		'indentation': 'tab',
		'selector-list-comma-newline-after': null,
		'at-rule-no-unknown': [true, {
			'ignoreAtRules': ['function', 'if', 'each', 'include', 'mixin', 'for']
		}]
	}
};
