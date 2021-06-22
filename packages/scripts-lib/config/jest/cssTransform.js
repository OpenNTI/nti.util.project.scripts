'use strict';

// This is a custom Jest transformer turning style imports into empty objects.
// http://facebook.github.io/jest/docs/tutorial-webpack.html

module.exports = {
	process() {
		return `
		module.exports.__esModule = true;
		module.exports.default = new Proxy(
			{},
			{
				get (_, property) {
					return property;
				},
			}
		);
		`;
	},

	getCacheKey() {
		// The output is always the same.
		return 'cssTransform-proxy-pass';
	},
};
