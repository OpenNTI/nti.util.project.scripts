'use strict';
const path = require('path');

module.exports = function setupEnv () {
	const file = process.argv[1];
	if (/tasks\/test\.js/.test(file)) {
		return path.resolve(path.dirname(process.argv[1]), '../config/');
	}

	try {
		const cwd = process.cwd();
		const {scripts} = require(path.resolve(cwd, 'package.json'));
		const [script] = scripts.test.split(' ');
		const config = path.join(cwd, 'node_modules', script, 'config');

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
