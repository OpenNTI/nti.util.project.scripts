// smoketests
'use strict';
const fs = require('fs-extra');
const {prepare, call} = require('./util/prepare');

prepare();

call('npm pack');

for( let f of fs.readdirSync(process.cwd())) {
	if (/\.tgz$/.test(f)) {
		// rm *.tgz #cleanup the tarball artifact
		fs.remove(f);
	}
}
