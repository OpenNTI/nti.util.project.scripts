/*globals window, globalThis*/
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
global.$AppConfig = global.$AppConfig || { server: 'dataserver2' };
