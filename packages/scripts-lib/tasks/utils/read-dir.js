'use strict';
const fs = require('fs');
const { join } = require('path');

Object.assign(module.exports, {
	listFiles,
	readdir
});

function readdir (dir) {
	const out = [];
	for (let file of fs.readdirSync(dir)) {
		file = join(dir,file);
		const stat = fs.statSync(file);
		out.push(...(stat.isDirectory() ? readdir(file) : [file]));
	}

	return out;
}

function listFiles (prefix) {
	if (!/\/$/.test(prefix)) {
		prefix += '/';
	}
	return readdir(prefix).map(x => x.replace(prefix, ''));
}
