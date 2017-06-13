/*eslint strict:0*/
'use strict';
const fs = require('fs');
const path = require('path');

const exists = f => {
	try { fs.accessSync(f); } catch (e) { return false; } return true; };

let dev;
let assets = path.resolve(__dirname, '../client');

try {
	if (!/dist\/server/i.test(__dirname)) {
		dev = require('./lib/devmode');
		assets = require('../config/paths').assetsRoot;
	}
} catch (e) {
	console.error(e.stack || e.message || e);
}

exports = module.exports = {

	register (expressApp, config) {
		const devmode = (dev) ? dev.setupDeveloperMode(config) : null;

		if (devmode) {
			expressApp.use(devmode.middleware); //serve in-memory compiled sources/assets
		}

		return {
			devmode,

			assets
		};

	}

};
