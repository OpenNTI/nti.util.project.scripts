'use strict';
global.beforeEach(() => {
	try {
		// patch moment to always return UTC, if its not installed, ignore.
		require('moment-timezone').tz.guess = () => 'UTC';
	} catch {
		//
	}
});
