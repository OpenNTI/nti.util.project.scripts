'use strict';
const findCacheDir = require('find-cache-dir'); //a dep of babel-loader

module.exports = function resolveCacheDir(name) {
	const self = require.resolve('@nti/app-scripts/package.json');
	const [root] = self.split('node_modules');
	// use workspace root for cache, or fallback to default location
	return findCacheDir({ cwd: root, name }) || true;
};
