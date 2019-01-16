'use strict';

const path = require('path');

const paths = require('./paths');

const cache = (options = {}) => ({
	loader: 'cache-loader',
	options: {
		cacheDirectory: path.resolve(paths.path, 'node_modules/.cache/nti-build'),
		...options
	}
});

module.exports = cache;
