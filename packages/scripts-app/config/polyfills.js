/*globals BUILD_SOURCE, BUILD_PACKAGE_NAME, BUILD_PACKAGE_VERSION, Element, CharacterData, DocumentType*/
'use strict';
require('core-js/stable');
require('regenerator-runtime/runtime');
require('whatwg-fetch');
require('abortcontroller-polyfill/dist/polyfill-patch-fetch');

global['revision'] = typeof BUILD_SOURCE !== 'undefined' && BUILD_SOURCE;
global['BUILD_PACKAGE_NAME'] =
	typeof BUILD_PACKAGE_NAME !== 'undefined' && BUILD_PACKAGE_NAME;
global['BUILD_PACKAGE_VERSION'] = global['version'] =
	typeof BUILD_PACKAGE_VERSION !== 'undefined' && BUILD_PACKAGE_VERSION;

if (typeof document !== 'undefined') {
	// from:https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/remove()/remove().md
	(function (arr) {
		arr.forEach(function (item) {
			if (Object.prototype.hasOwnProperty.call(item, 'remove')) {
				return;
			}

			Object.defineProperty(item, 'remove', {
				configurable: true,
				enumerable: true,
				writable: true,
				value: function remove() {
					if (this.parentNode !== null) {
						this.parentNode.removeChild(this);
					}
				},
			});
		});
	})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);
}
