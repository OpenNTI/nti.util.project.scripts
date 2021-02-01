'use strict';
const path = require('path');

const resolve = require('resolve');
const fs = require('fs-extra');

const CACHE = {};

const NTI_MAPPED = /^@nti\/[^/]+\/src$/;

module.exports = function (request, context) {
	// try {
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

	const ntiContext = {
		...context,
		packageFilter(pkg, pkgFile, dir) {
			dir = (dir || pkgFile).replace(/package\.json$/, '');
			if (pkg.module && fs.existsSync(path.join(dir, pkg.module))) {
				return {
					...pkg,
					main: pkg.module
				};
			}

			return pkg;
		}
	};

	const key = request + '|' + JSON.stringify(context);
	const resolveOpts = request.startsWith('@nti/') ? ntiContext : context;
	try {
		if (CACHE[key]) {
			return CACHE[key];
		}

		return CACHE[key] = resolve.sync(request, resolveOpts);
	} catch (e) {
		return CACHE[key] = resolve.sync(request, {
			...resolveOpts,
			basedir: rootDir || basedir
		});
	}
	// } catch (e) {
	// 	console.error(`\n\n%s\n${request}\n%o`, e, context);
	// 	throw e;
	// }
};
