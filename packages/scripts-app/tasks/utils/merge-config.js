'use strict';

const isObject = x =>
	typeof x === 'object' && Object.getPrototypeOf(x) === Object.prototype;

module.exports = function merge(a, b) {
	if (!isObject(a) || (b && !isObject(b))) {
		throw new TypeError('Arguments must be objects');
	}

	if (!b) {
		return a;
	}

	for (let key of Object.keys(b)) {
		if (isObject(a[key])) {
			a[key] = merge(a[key], b[key]);
		} else if (Array.isArray(a[key]) && Array.isArray(b[key])) {
			//append unique new values
			for (let entry of b[key]) {
				if (!a[key].includes(entry)) {
					a[key] = [...a[key], entry];
				}
			}
		} else {
			a[key] = b[key];
		}
	}

	return a;
};
