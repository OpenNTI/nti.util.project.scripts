'use strict';
const path = require('path');

module.exports = function setupEnv () {
	try {
		let config;

		const [,file] = process.argv;

		if (/tasks\/test\.js/.test(file)) {
			config = path.resolve(path.dirname(file), '../config/');
		}
		else {
			const cwd = process.cwd();
			const {scripts} = require(path.resolve(cwd, 'package.json'));
			const [script] = scripts.test.split(' ');

			config = path.join(cwd, 'node_modules', script, 'config');
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
