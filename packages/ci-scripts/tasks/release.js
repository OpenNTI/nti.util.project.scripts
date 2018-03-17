// release
'use strict';
const fs = require('fs-extra');
const { call, nofail, lockfile, modulesDir } = require('./util/prepare');


fs.remove(modulesDir);

if (fs.existsSync(lockfile)) {
	if (call('git checkout package-lock.json', nofail) !== 0) {
		fs.remove(lockfile);
	}
}


call('npm install');
call('npm publish');
