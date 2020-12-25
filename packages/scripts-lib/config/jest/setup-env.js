'use strict';
const fs = require('fs');
const path = require('path');
const resolveScriptDir = require('../resolve-script-dir');

module.exports = function setupEnv () {
	try {
		const [,file] = process.argv;
		const setupFiles = [];
		const setupFilesAfterEnv = [];

		const config =
			(/tasks\/test\.js/.test(file))
				? path.resolve(path.dirname(file), '../config/')
				: path.join(resolveScriptDir(), 'config');

		try {
			const init = path.join(config, 'jest.js');
			if (fs.existsSync(init)) {
				const {setupFiles: a, setupFilesAfterEnv: b} = require(init) || {};
				if(a) {
					setupFiles.push(...a);
				}
				if(b) {
					setupFilesAfterEnv.push(...b);
				}
			}
		}
		catch (e) {
			console.error(e.stack);
		}

		return {
			config,
			setupFiles,
			setupFilesAfterEnv
		};
	} catch (e) {
		throw new Error('Could not resolve config!');
	}
};
