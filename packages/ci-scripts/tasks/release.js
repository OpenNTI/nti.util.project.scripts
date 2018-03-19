// release
'use strict';
const fs = require('fs-extra');
const { call, nofail, lockfile } = require('./util/prepare');


if (fs.existsSync(lockfile)) {
	if (call('git checkout package-lock.json', nofail) !== 0) {
		fs.remove(lockfile);
	}
}


call('npm ci');
call('npm publish');
