'use strict';
const path = require('path');
const fs = require('fs-extra');

const DEBUG = process.argv.includes('--debug');
const ENV_KEY = '__NTI_WORKSPACE';

function isListed (x, list) {
	return (Array.isArray(list) && list.find(y => ~x.indexOf(y)));
}

function include (file, whitelist, blacklist) {
	if (blacklist && isListed(file, blacklist)) {
		return false;
	}

	if (whitelist && !isListed(file, whitelist)) {
		return false;
	}

	return true;
}

module.exports = function getWorkspace (workspace, entryPackage, {regexp = false} = {}) {
	if (process.env[ENV_KEY]) {
		return JSON.parse(process.env[ENV_KEY]);
	}

	let data;
	try {
		data = fs.readJSONSync(workspace);
	} catch (e) {
		if (e.code !== 'ENOENT') {
			console.error('[workspace] Error:', e.message);
			process.exit(1);
		}
	}

	const {whitelist = false, blacklist = false, ...options} = data || {};
	const workspaceDir = path.resolve(path.dirname(workspace), options.path || '.');
	const assumeInstalled = options.ignoreInstallState;
	const packages = {};
	const aliases = {};
	console.log('[workspace] Generating workspace bindings...');

	const list = fs.readdirSync(workspaceDir)
		.map(x => path.join(workspaceDir, x, 'package.json'))
		.filter(x => fs.existsSync(x) && x !== entryPackage);

	list.filter(x => {
		const dir = path.dirname(x);
		const pkg = fs.readJsonSync(x);
		const has = Boolean((pkg.module || pkg.main) && pkg.name);

		if (has) {
			if (!include(x, whitelist, blacklist)) {
				if (DEBUG) {
					console.log('[workspace] excluding "%s"', dir);
				}
				return false;
			}

			const entry = path.join(dir, pkg.module || pkg.main);
			const installed = assumeInstalled || fs.existsSync(path.join(dir, 'node_modules'));
			if (!fs.existsSync(entry) || !installed) {
				if (DEBUG || isListed(x, whitelist)) {
					console.warn('[workspace] Ignoring "%s" because it is not installed.', dir);
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
