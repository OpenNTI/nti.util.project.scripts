'use strict';
const path = require('path');
const fs = require('fs');

module.exports = Object.assign(exports, {
	resolve,
	find,
});

function resolve(pkg) {
	try {
		return path.dirname(require.resolve(path.join(pkg, 'package.json')));
	} catch {
		return null;
	}
}

function find(file, limit = 10) {
	const abs = path.resolve(file);
	const atRoot = path.resolve(path.join('..', file)) === abs;

	if (fs.existsSync(abs)) {
		return path.dirname(abs);
	}

	return limit <= 0 || atRoot ? null : find(path.join('..', file), limit - 1);
}
