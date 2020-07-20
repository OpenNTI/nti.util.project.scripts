'use strict';
const fs = require('fs-extra');
const { call } = require('./util');

call('npm run build');
call('npm pack');

for( let f of fs.readdirSync(process.cwd())) {
	if (/\.tgz$/.test(f)) {
		// rm *.tgz #cleanup the tarball artifact
		fs.removeSync(f);
	}
}
