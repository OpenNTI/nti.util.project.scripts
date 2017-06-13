'use strict';

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
					'browsers': ['> 1% in US', 'last 2 versions', 'safari >= 6']
				},
			}],
			'stage-1'
		],
		'plugins': [
			'transform-decorators-legacy',
			'transform-runtime'
		]
	});
}
