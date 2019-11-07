'use strict';

const path = require('path');
const bl = require('@nti/lib-scripts/config/browserlist');

const paths = require('./paths');

const cache = (options = {}) => ({
	loader: 'cache-loader',
	options: {
		cacheDirectory: path.resolve(paths.path, 'node_modules/.cache/nti-build'),
		cacheIdentifier: `-cache- ${bl.join(',')} ${process.env.NODE_ENV}`,
		...options
	}
});

module.exports = cache;
