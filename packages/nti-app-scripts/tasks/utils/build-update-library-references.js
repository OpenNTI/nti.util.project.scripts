'use strict';
const fs = require('fs-extra');
const path = require('path');

const paths = require('../../config/paths');

const {
	PAGE,
} = paths;

const EXTERNAL_LIBS = {
	'react': '',
	'react-dom': '',
};

Object.keys(EXTERNAL_LIBS).forEach(x =>
	EXTERNAL_LIBS[x] = fs.readJsonSync(path.resolve(paths.path, 'node_modules', x, 'package.json')).version);


module.exports = function updateReferences () {
	const pageSrc = fs.readFileSync(PAGE, {encoding: 'UTF-8'})
		.replace(
			/(react\/)(.+)\/(.+)\.js/gm,
			(_, p, v, script) => (p + v + '/' + script + '.min.js')
		);

	return fs.writeFileSync(PAGE, pageSrc);
};
