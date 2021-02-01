'use strict';
const { format } = require('util');

global.beforeEach(() => {});

global.console.error = (...args) => {
	throw new Error(format(...args));
};
global.console.warn = (...args) => {
	throw new Error(format(...args));
};

process.on('unhandledRejection', error => {
	process.exitCode = process.exitCode || 1;
	throw error;
});
