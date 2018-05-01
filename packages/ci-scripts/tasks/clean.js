//Cleans the workspace by removing the modules and reports directories
'use strict';
const fs = require('fs-extra');
const path = require('path');

const { print, reprint } = require('./util');

const cwd = process.cwd();

[
	'node_modules',
	'reports'
].forEach(dir => {
	dir = path.join(cwd, dir);
	print('Deleting: %s ... ', dir);
	fs.removeSync(dir);
	reprint('Deleting: %s ... done.', dir);
});
