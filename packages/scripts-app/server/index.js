/*eslint strict:0*/
'use strict';
const path = require('path');

let dev;
let assets = path.resolve(__dirname, '../client');

try {
	// This entire directory is copied to the dist dir on build.
	// This check sets up dev mode if this is still running from
	// the source directory.
	if (!/dist\/server/i.test(__dirname)) {
		dev = require('./lib/devmode');
		assets = require('../config/paths').assetsRoot;
	}
} catch (e) {
	console.error(e.stack || e.message || e);
}

exports = module.exports = {
	async register(expressApp, config) {
		const devmode = dev
			? await dev.setupDeveloperMode(config, expressApp)
			: null;

		return {
			devmode,
			assets,
		};
	},
};
