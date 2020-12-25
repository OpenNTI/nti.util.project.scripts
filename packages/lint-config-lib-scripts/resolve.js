'use strict';
const path = require('path');

module.exports = function resolve (pkg) {
	try {
		return path.dirname(require.resolve(path.join(pkg, 'package.json')));
	} catch {
		return null;
	}
};
