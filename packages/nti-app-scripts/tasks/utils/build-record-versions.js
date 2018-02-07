'use strict';
/*
	@npm ls 2>/dev/null | grep nti- | sed -e 's/^[\│\├\─\┬\└\ ]\{1,\}/z /g' | sort | sed -e 's/^z/-/g' > $(DIST)client/js/nti-versions.txt || true
*/
const path = require('path');
const fs = require('fs-extra');
const {spawnSync} = require('child_process');
const paths = require('../../config/paths');


const removePaths = (line) => (~line.indexOf(paths.path)) ? null : line;


const call = (cmd, ...args) => spawnSync(cmd, args, {
	//npm doesn't output anything when NODE_ENV = 'production'
	env: Object.assign({}, process.env, { NODE_ENV: null }),
	stdio: [null, 'pipe', null],
	maxBuffer: 1024 * 1024 //1MB max
});


module.exports = function recordVersions () {
	fs.ensureDirSync(path.resolve(paths.DIST_CLIENT, 'js'));
	const versionFile = path.resolve(paths.DIST_CLIENT, 'js/version');
	const versions = path.resolve(paths.DIST_CLIENT, 'js/versions.txt');
	const ntiVersions = path.resolve(paths.DIST_CLIENT, 'js/nti-versions.txt');

	const {version} = fs.readJsonSync(paths.packageJson);

	fs.writeFileSync(versionFile, version);

	let list;

	const {stdout: listBuffer} = call('npm', 'list', '--long');
	if (listBuffer) {
		list = listBuffer
			.toString('utf8')
			.split(/[\r\n]+/)
			.map(removePaths)
			.filter(Boolean);
		fs.writeFileSync(versions, list.join('\n'));
	}

	const {stdout: ntiListBuffer} = call('npm', 'list', '--parseable', '--long');
	if (ntiListBuffer) {
		const deps = ntiListBuffer
			.toString('utf8')
			.split(/[\r\n]+/)
			.filter(x => /:nti-/.test(x)
				// Web service bundles its dependencies so, it will polute our list...
				// ...so omit its dependencies.
				&& !/\/nti-web-service\//.test(x)
			)
			.map(x => '- ' + x.split(':')[1]);


		list = [
			version,
			...deps.sort()
		];

		fs.writeFileSync(ntiVersions, list.join('\n'));
	}
};
