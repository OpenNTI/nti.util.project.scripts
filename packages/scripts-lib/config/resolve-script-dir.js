'use strict';
const path = require('path');

module.exports = function resolveScript(root = process.cwd()) {
	const { scripts } = require(path.resolve(root, 'package.json'));
	const [script] = scripts.test.split(' ');

	const pk = require.resolve(path.join('@nti', script, 'package.json'));
	return path.dirname(pk);
};
