'use strict';
const fs = require('fs');
const path = require('path');
const resolveScriptDir = require('./resolve-script-dir');

module.exports = function setupEnv () {
	try {
		const [,file] = process.argv;

		const config =
			(/tasks\/test\.js/.test(file))
				? path.resolve(path.dirname(file), '../config/')
				: path.join(resolveScriptDir(), 'config');

		try {
			const init = path.join(config, 'jest.js');
			if (fs.existsSync(init)) {
				require(init);
			}
		}
		catch (e) {
			console.error(e.stack);
		}

		return {config};
	} catch (e) {
		throw new Error('Could not resolve config!');
	}
};
