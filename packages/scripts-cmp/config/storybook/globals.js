/*globals window, globalThis, DEV_DATA_SERVER_AUTH*/
'use strict';
require('regenerator-runtime');
let g =
	typeof globalThis !== 'undefined'
		? globalThis
		: typeof window === 'undefined'
		? global
		: window.global || window;
if (!globalThis.global) {
	globalThis.global = g;
}

global.$AppConfig = {
	server: '/dataserver2/',
	extraHeaders: {
		authorization: DEV_DATA_SERVER_AUTH,
	},
};
