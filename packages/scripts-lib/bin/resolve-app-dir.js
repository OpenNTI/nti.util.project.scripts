'use strict';
const fs = require('fs-extra');
const path = require('path');

const escapePattern = /[|\\{}()[\]^$+*?.]/g;
const isModule = RegExp.prototype.test.bind(/\/node_modules\//);

Object.assign(exports, {
	resolveAppDir
});


function resolveAppDir (start, dep) {

	function resolve (dir) {
		const parent = path.dirname(dir);
		const pkg = path.join(dir, 'package.json');

		if (parent === dir) {
			return false;
		}

		if (testPackage(pkg, dep)) {
			return dir;
		}

		return resolve(parent);
	}

	if (dep && !dep.test) {
		dep = new RegExp(`^${dep.replace(escapePattern, '\\$&')}$`);
	}

	return resolve(start) || start;
}


function testPackage (pkg, dep) {
	try {
		if (isModule(pkg)) {
			return false;
		}

		const {devDependencies, dependencies} = fs.readJsonSync(pkg);
		const o = Object.keys({...devDependencies, ...dependencies});

		return !dep || ~o.findIndex(x => dep.test(x));
	} catch (e) {
		return false;
	}
}
