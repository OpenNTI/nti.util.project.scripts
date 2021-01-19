'use strict';
const path = require('path');
const fs = require('fs-extra');
const {isCI} = require('ci-info');
const {sync: glob} = require('glob');

const ENV = process.env.NODE_ENV || 'development';
const PROD = ENV === 'production';
const DEBUG = process.argv.includes('--debug');
const ENV_KEY = '__NTI_WORKSPACE';
const isBlocked = isCI || PROD || !!process.env.__NTI_RELEASING;

const arr = x => Array.isArray(x) ? x : (x ? [x] : []);

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

module.exports = function getWorkspace (entryPackage, {regexp = false} = {}) {
	if (isBlocked || process.env[ENV_KEY]) {
		return JSON.parse(process.env[ENV_KEY] || '{}');
	}

	const workspaceOptions = readWorkspaceOptions();
	if (!workspaceOptions) {
		return {};
	}

	const {debug, verbose, whitelist = false, blacklist = false} = workspaceOptions;
	const LOG = verbose || debug || DEBUG;

	const packages = {};
	const aliases = {};
	console.log('[workspace] Generating workspace bindings...');

	listWorkspacePackages(entryPackage, workspaceOptions)
		.filter(x => {
			const dir = path.dirname(x);
			const pkg = fs.readJsonSync(x, { throws: false });
			if (!pkg) {
				console.warn(`[workspace] Ignoring "${dir}". Invalid JSON: ${x}`);
				return false;
			}
			if (isLinked(x, pkg.name)) {
				if (LOG) {
					console.log('[workspace] excluding "%s", because its natively linked by npm.', dir);
				}
				return false;
			}
			const has = Boolean((pkg.module || pkg.main) && pkg.name);

			if (has) {
				if (!include(x, whitelist, blacklist)) {
					if (LOG) {
						console.log('[workspace] excluding "%s"', dir);
					}
					return false;
				}

				const entry = path.join(dir, pkg.module || pkg.main);
				if (!fs.existsSync(entry)) {
					if (LOG) {
						console.warn('[workspace] Ignoring "%s" because it is missing an entry, or the entry specified does not exist.', dir);
					}
					return false;
				}

				if (!isPackageInstalled(dir, workspaceOptions)) {
					if (LOG || isListed(x, whitelist)) {
						console.warn('[workspace] Ignoring "%s" because it is not installed.', dir);
					}
					return false;
				}

				if (regexp) {
					aliases['^' + pkg.name.replace(/([.-/])/g, '\\$1')] = dir;
				} else {
					aliases[pkg.name] = dir;
				}

				packages[pkg.name] = pkg;
			}

			return has;
		});

	if (LOG) {
		for (let key of Object.keys(aliases)) {
			console.log('[workspace] Mapping %s => %s', key.replace(/[\^\\]/g, ''), aliases[key]);
		}
	}
	else {
		const {length: count} = Object.keys(aliases);
		if (count > 0) {
			console.log(`[workspace] Linked ${count} modules from workspace...`);
		}
	}

	process.env[ENV_KEY] = JSON.stringify(aliases);
	return aliases;
};


function find (file, limit = 4) {
	const abs = path.resolve(file);
	const atRoot = path.resolve(path.join('..', file)) === abs;

	const result = glob(abs);

	if (result.length > 0) {
		return result.length > 1 ? result : result[0];
	}

	return (limit <= 0 || atRoot) ? null : find(path.join('..', file), limit - 1);
}

function isPackageInstalled (dir, options) {
	if (options.ignoreInstallState) {
		return true;
	}

	const local = path.join(dir, 'node_modules');
	const workspace = path.join(options.workspaceDir, 'node_modules');

	return [local, workspace].some(f => fs.existsSync(f));
}

function readWorkspaceOptions () {

	function read (file) {
		if (!file) {
			return null;
		}
		const content = fs.readFileSync(file, 'utf-8');

		try {
			return JSON.parse(content);
		} catch {
			if (content) {
				console.warn(`[workspace] Invalid JSON: ${file}`);
			}
		}
	}


	const workspace = find('./.workspace.json');
	const workspacePackage = find('../package.json');
	const KEY = 'nextthought-workspace-options';
	try {
		const wkp = read(workspace);
		const pkg = read(workspacePackage);
		const opts = pkg?.[KEY];

		if (!wkp && !opts ) {
			if (pkg) {
				console.warn('[workspace] Missing "%s" in ', KEY, workspacePackage);
				process.exit();
			}
			return null;
		}

		if (wkp && opts && path.dirname(workspace) === path.dirname(workspacePackage)) {
			console.warn('[workspace] Two configuration files found.\n' +
				'The values in %s will be merged with the values in "%s",' +
				' under the key: "%s"',
			workspace,
			workspacePackage,
			KEY);
		}

		const data = {
			...wkp,
			...opts,
		};

		return {
			...data,
			workspaceDir: path.resolve(path.dirname(workspace || workspacePackage), data?.path || '.')
		};
	} catch (e) {
		if (e.code !== 'ENOENT') {
			console.error('[workspace] Error:', e.message);
			process.exit(1);
		}
	}
}

function listWorkspacePackages (entryPackage, {workspaceDir, useVSCodeWorkspace}) {
	let list;
	if (useVSCodeWorkspace) {
		list = arr(find('./*.code-workspace'))
			// if useVSCodeWorkspace is a string, find it in the found path to filter down
			.filter(x => useVSCodeWorkspace === true || ~x.indexOf(useVSCodeWorkspace))
			// read the file in, and use its paths
			.map(x => {
				const data = fs.readJSONSync(x, { throws: false });
				if (!data) {
					console.warn(`[workspace] Ignoring workspace file, invalid JSON: ${x}`);
				}
				return data?.folders?.reduce((f, entry) => [...f, path.join(path.dirname(x), entry.path)], []);
			})
			// flatten
			.reduce((f, e) => [...f, ...(e || [])], [])
			// Keep the entries looking the same as glob
			.map(dir => path.join(dir, 'package.json'));

	} else {
		// Find all the project directories
		list = glob(path.join('**', 'package.json'), {cwd: workspaceDir, ignore: ['**/node_modules/**']});
	}

	// ignore npm workspace level package as well as the entry package.
	const workspacePackage = path.join(workspaceDir, 'package.json');

	return list
		.map(x => path.resolve(workspaceDir, x))
		.filter(x => x !== entryPackage && x !== workspacePackage);
}


function isLinked (pkgPath, name) {
	try {
		const s = require.resolve(path.join(name, 'package.json'));
		return s === pkgPath || fs.realpathSync(s) === pkgPath;
	} catch {
		//
	}
	return false;
}
