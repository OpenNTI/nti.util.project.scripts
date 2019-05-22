/*eslint strict:0*/
'use strict';
const path = require('path');

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
		const resolveDev = (dev) ? dev.setupDeveloperMode(config) : Promise.resolve();

		return resolveDev.then(devmode => {

			if (devmode) {
				(expressApp.parent || expressApp).use(devmode.middleware); //serve in-memory compiled sources/assets
			}

			return {
				devmode,

				assets
			};
		});
	}

};
