'use strict';
// Test queries and coverage here: http://browserl.ist
const { NTI_DEV_BROWSER } = process.env;
module.exports = NTI_DEV_BROWSER ? NTI_DEV_BROWSER.split(',') : [
	'> 1% in US',
	'last 2 versions',
	'not dead',
	'IE 11',
];
