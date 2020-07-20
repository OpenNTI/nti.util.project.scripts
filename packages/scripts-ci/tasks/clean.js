//Cleans the workspace by removing the modules and reports directories
'use strict';
const fs = require('fs-extra');
const path = require('path');

const { printLine, print } = require('./util');

const cwd = process.cwd();
printLine('::group::Clean');
[
	'node_modules',
	'reports'
].forEach(dir => {
	dir = path.join(cwd, dir);
	print('Deleting: %s ... ', dir);
	fs.removeSync(dir);
	printLine('done.');
});
printLine('::endgroup::')
