'use strict';

const path = require('path');
const fs = require('fs');

const appDirectory = fs.realpathSync(process.cwd());
function resolveApp (relativePath) {
	return path.resolve(appDirectory, relativePath);
}

module.exports = {
	resolveApp,

	path: resolveApp('.'),
	packageJson: resolveApp('package.json'),
};
