'use strict';
const path = require('path');
const fs = require('fs-extra');

const DEBUG = process.argv.includes('--debug');
const ENV_KEY = '__NTI_WORKSPACE';

function include (file, whitelist, blacklist) {
	if (Array.isArray(blacklist) && blacklist.find(x => ~file.indexOf(x))) {
		return false;
	}

	if (Array.isArray(whitelist) && !whitelist.find(x => ~file.indexOf(x))) {
		return false;
	}

	return true;
}

module.exports = function getWorkspace (workspace, entryPackage, {regexp = false} = {}) {
	if (process.env[ENV_KEY]) {
		return JSON.parse(process.env[ENV_KEY]);
	}

	const {whitelist = false, blacklist = false, ...options} = fs.readJsonSync(workspace, { throws: false }) || {};
	const workspaceDir = path.resolve(path.dirname(workspace), options.path || '.');
	const packages = {};
	const aliases = {};
	console.log('[workspace] Generating workspace bindings...');

	fs.readdirSync(workspaceDir)
		.map(x => path.join(workspaceDir, x, 'package.json'))
		.filter(x => fs.existsSync(x) && x !== entryPackage)
		.filter(x => include(x, whitelist, blacklist))
		.filter(x => {
			const dir = path.dirname(x);
			const pkg = fs.readJsonSync(x);
			const has = Boolean((pkg.module || pkg.main) && pkg.name);


			if (has) {
				const entry = path.join(dir, pkg.module || pkg.main);
				const installed = fs.existsSync(path.join(dir, 'node_modules'));
				if (!fs.existsSync(entry) || !installed) {
					if (DEBUG) {
						console.warn('[workspace] Ignoring "%s" because it does not exist or is not installed.', entry);
					}
				} else {
					if (regexp) {
						aliases['^' + pkg.name.replace(/([.-/])/g, '\\$1')] = dir;
					} else {
						aliases[pkg.name] = dir;
					}

					packages[pkg.name] = pkg;
				}
			}

			return has;
		});

	for (let key of Object.keys(aliases)) {
		console.log('[workspace] Mapping %s => %s', key.replace(/[\^\\]/g, ''), aliases[key]);
	}

	process.env[ENV_KEY] = JSON.stringify(aliases);
	return aliases;
};
