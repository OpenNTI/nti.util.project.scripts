'use strict';
/*
	@npm ls 2>/dev/null | grep nti- | sed -e 's/^[\│\├\─\┬\└\ ]\{1,\}/z /g' | sort | sed -e 's/^z/-/g' > $(DIST)client/js/nti-versions.txt || true
*/
const path = require('path');
const fs = require('fs-extra');
const { spawnSync } = require('child_process');
const paths = require('../../config/paths');

const removePaths = line => (~line.indexOf(paths.path) ? null : line);

//TODO: rewrite this into an async function
const call = (cmd, ...args) =>
	spawnSync(cmd, args, {
		//npm doesn't output anything when NODE_ENV = 'production'
		env: { ...process.env, NODE_ENV: 'development' },
		stdio: ['ignore', 'pipe', 'pipe'],
		maxBuffer: 1024 * 1024, //1MB max
	});

module.exports = async function recordVersions() {
	fs.ensureDirSync(path.resolve(paths.DIST_CLIENT, 'js'));
	const versionFile = path.resolve(paths.DIST_CLIENT, 'js/version');
	const versions = path.resolve(paths.DIST_CLIENT, 'js/versions.txt');
	const ntiVersions = path.resolve(paths.DIST_CLIENT, 'js/nti-versions.txt');

	const { version } = fs.readJsonSync(paths.packageJson);

	return Promise.all([fs.writeFile(versionFile, version), long(), short()]);

	async function long() {
		const { stdout: listBuffer } = call(
			'npm',
			'list',
			'--dev',
			'--prod',
			'--long'
		);
		if (listBuffer) {
			const list = listBuffer
				.toString('utf8')
				.split(/[\r\n]+/)
				.map(removePaths)
				.filter(Boolean);
			await fs.writeFile(versions, list.join('\n'));
		}
	}

	async function short() {
		const { stdout: ntiListBuffer } = call(
			'npm',
			'list',
			'--dev',
			'--prod',
			'--parseable',
			'--long'
		);
		if (ntiListBuffer) {
			const deps = ntiListBuffer
				.toString('utf8')
				.split(/[\r\n]+/)
				.slice(1) //remove the entry line
				.filter(
					x =>
						/:@?nti([-/])/.test(x) &&
						// Web service bundles its dependencies so, it will polute our list...
						// ...so omit its dependencies.
						!/\/(@?nti[-/])web-service\//.test(x)
				)
				.map(x => '- ' + x.split(':')[1]);

			await fs.writeFile(
				ntiVersions,
				[version, ...deps.sort()].join('\n')
			);
		}
	}
};
