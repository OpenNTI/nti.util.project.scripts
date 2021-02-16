'use strict';
const fs = require('fs-extra');
const path = require('path');
const paths = require('./paths');

module.exports = exports = function getVersionsFor(modules) {
	if (
		!modules ||
		!Array.isArray(modules) ||
		modules.some(x => typeof x !== 'string')
	) {
		throw new TypeError('Invalid argument');
	}

	const EXTERNAL_LIBS = {};

	modules.forEach(
		x =>
			(EXTERNAL_LIBS[x] = fs.readJsonSync(
				path.resolve(paths.path, 'node_modules', x, 'package.json')
			).version)
	);

	return EXTERNAL_LIBS;
};
