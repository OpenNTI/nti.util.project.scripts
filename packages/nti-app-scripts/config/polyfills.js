/*globals BUILD_SOURCE, BUILD_PACKAGE_NAME, BUILD_PACKAGE_VERSION*/
'use strict';
require('babel-polyfill');
global['revision'] = typeof BUILD_SOURCE !== 'undefined' && BUILD_SOURCE;
global['BUILD_PACKAGE_NAME'] = typeof BUILD_PACKAGE_NAME !== 'undefined' && BUILD_PACKAGE_NAME;
global['BUILD_PACKAGE_VERSION'] = global['version'] = typeof BUILD_PACKAGE_VERSION !== 'undefined' && BUILD_PACKAGE_VERSION;
