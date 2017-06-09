/*eslint strict:0*/
'use strict';
const fs = require('fs');
const path = require('path');

const dev = require('./lib/devmode');

const exists = f => {
	try { fs.accessSync(f); } catch (e) { return false; } return true; };

const distAssets = path.resolve(__dirname, '../client');
const srcAssets = path.resolve(__dirname, '../main');

exports = module.exports = {

	register (expressApp, config) {

		const assets = exists(distAssets) ? distAssets : srcAssets;

		const devmode = (srcAssets === assets) ? dev.setupDeveloperMode(config) : null;

		if (devmode) {
			expressApp.use(devmode.middleware); //serve in-memory compiled sources/assets
		}

		return {
			devmode,

			assets
		};

	}

};
