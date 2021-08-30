/*globals DEV_DATA_SERVER_AUTH*/
'use strict';
require('regenerator-runtime');
require('@nti/app-scripts/config/polyfills');

global.$AppConfig =
	typeof DEV_DATA_SERVER_AUTH !== 'undefined'
		? {
				server: '/dataserver2/',
				extraHeaders: {
					authorization: DEV_DATA_SERVER_AUTH,
				},
		  }
		: { server: 'mock:/dataserver2/' };
