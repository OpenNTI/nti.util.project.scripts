'use strict';

if (process.argv[1] === module.filename) {
	process.argv[1] = require.resolve('nti-lib-scripts/tasks/test');
}

require('nti-lib-scripts/tasks/test');
