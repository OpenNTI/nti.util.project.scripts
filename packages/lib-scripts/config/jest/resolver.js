'use strict';
const path = require('path');

const resolve = require('resolve');
const fs = require('fs-extra');

const CACHE = {};

module.exports = function (request, context) {
	try {
		const { basedir, rootDir } = context;

		//Handle workspace links... and make 'pkg.module' resolve.
		if (request[0] === '/') {
			const pkgPath = path.join(request, 'package.json');

			if (fs.existsSync(pkgPath)) {
				const pkg =
					CACHE[pkgPath] ||
					(CACHE[pkgPath] = fs.readJsonSync(pkgPath));
				const file = path.join(request, pkg.module || pkg.main);
				if (fs.existsSync(file)) {
					return file;
				}
			}
		}

		try {
			return resolve.sync(request, context);
		} catch (e) {
			return resolve.sync(request, {
				...context,
				basedir: rootDir || basedir
			});
		}
	} catch (e) {
		// console.error(`\n\n%s\n${request}\n%o`, e, context);
		throw e;
	}
};
