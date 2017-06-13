'use strict';
/*
	@npm ls 2>/dev/null | grep nti- | sed -e 's/^[\│\├\─\┬\└\ ]\{1,\}/z /g' | sort | sed -e 's/^z/-/g' > $(DIST)client/js/nti-versions.txt || true
*/
const path = require('path');
const fs = require('fs-extra');
const spawn = require('cross-spawn');
const paths = require('../../config/paths');


const call = (cmd, ...args) => spawn.sync(cmd, args, {
	//npm doesn't output anything when NODE_ENV = 'production'
	env: Object.assign({}, process.env, { NODE_ENV: null }),
	stdio: [0, 'pipe', 2],
	maxBuffer: 1024 * 1024 //1MB max
});


module.exports = function recordVersions () {
	fs.ensureDirSync(path.resolve(paths.DIST_CLIENT, 'js'));
	const versions = path.resolve(paths.DIST_CLIENT, 'js/versions.txt');
	const ntiVersions = path.resolve(paths.DIST_CLIENT, 'js/nti-versions.txt');

	let list;

	const {status: laErr, stdout: listBuffer} = call('npm', 'list', '--long');
	if (!laErr && listBuffer) {
		list = listBuffer.toString('utf8');
		fs.writeFileSync(versions, list);
	}

	const {status: lsErr, stdout: ntiListBuffer} = call('npm', 'list');
	if (!lsErr && ntiListBuffer) {
		list = ntiListBuffer
			.toString('utf8')
			.split('\n')
			.filter(x => /nti-/.test(x))
			.map(x => x.replace(/^[│└├─┬\s]{1,}/, '- ').trim())
			.join('\n');
		fs.writeFileSync(ntiVersions, list);
	}
};
