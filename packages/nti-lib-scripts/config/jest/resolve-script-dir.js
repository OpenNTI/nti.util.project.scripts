'use strict';
const path = require('path');

module.exports = function resolveScript (root = process.cwd()) {
	const {scripts} = require(path.resolve(root, 'package.json'));
	const [script] = scripts.test.split(' ');

	return path.join(root, 'node_modules', '@nti', script);
};
