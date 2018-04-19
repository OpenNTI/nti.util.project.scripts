'use strict';
const path = require('path');
const resolveScriptDir = require('./resolve-script-dir');

module.exports = function setupEnv () {
	try {
		let config;

		const [,file] = process.argv;

		if (/tasks\/test\.js/.test(file)) {
			config = path.resolve(path.dirname(file), '../config/');
		}
		else {
			config = path.join(resolveScriptDir(), 'config');
		}

		try {
			require(path.join(config, 'jest'));
		}
		catch (e) {
			console.error(e.stack);
		}

		return {config};
	} catch (e) {
		throw new Error('Could not resolve config!');
	}
};
