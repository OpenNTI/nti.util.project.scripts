/* eslint-disable no-undef */
'use strict';
const crypto = require('crypto');
const { promises: fs } = require('fs');

const mock = require('@nti/lib-scripts/tasks/utils/mock');

(async () => {
	const chunks = JSON.parse(
		await fs.readFile('./chunks.json', { encoding: 'utf-8' })
	);

	const self = (globalThis.self = globalThis);
	self.Ext = mock();
	self.HTMLElement = self.HTMLElement || mock();
	self.Image = mock();
	self.crypto = Object.assign(crypto, { getRandomValues: x => x });
	self.fetch = async () => Promise.resolve(mock());
	self.history = mock();
	self.location = mock();
	self.screen = mock();
	self.requestAnimationFrame = setImmediate;
	self.cancelAnimationFrame = clearImmediate;
	self.btoa = x => Buffer.from('' + x, 'binary').toString('base64');
	self.atob = x => Buffer.from(x, 'base64').toString('ascii');

	const pwd = process.cwd();
	console.log('Extracting Strings...');

	for (const chunk of chunks.reverse()) {
		try {
			require(`${pwd}/${chunk}`);
		} catch (e) {
			console.error(e.stack);
			process.exitCode = 1;
		}
	}

	if (typeof __getLocalData !== 'undefined') {
		await fs.writeFile(
			'./strings.known.json',
			JSON.stringify(__getLocalData().translations, null, 2)
		);
	} else {
		console.error('There was an error processing strings');
	}

	// Cut off pending promises and tasks that might
	// have been started by including app code.
	process.exit(process.exitCode);
})();
