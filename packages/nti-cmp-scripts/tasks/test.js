'use strict';

if (process.argv[1] === module.filename) {
	process.argv[1] = require.resolve('nti-lib-scripts/tasks/test');
}

process.env.JEST_ENV = 'jsdom';
require('nti-lib-scripts/tasks/test');
