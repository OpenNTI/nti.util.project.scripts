'use strict';
const browsers = require('./browserlist');

const env = process.env.BABEL_ENV || process.env.NODE_ENV;

const base = {
	'compact': false,
	'sourceMaps': 'both',
};

if (env === 'test') {
	module.exports = Object.assign(base, {
		'plugins': ['transform-decorators-legacy'],
		'presets': [
			['env', {
				'useBuiltIns': true,
				'targets': {
					'node': 'current'
				}
			}],
			'stage-1'
		]
	});
}
else {
	module.exports = Object.assign(base, {
		'presets': [
			['env', {
				'useBuiltIns': true,
				'modules': false,
				'targets': {
					browsers
				},
			}],
			'stage-1'
		],
		'plugins': [
			'transform-decorators-legacy',
			'external-helpers'
		]
	});
}
