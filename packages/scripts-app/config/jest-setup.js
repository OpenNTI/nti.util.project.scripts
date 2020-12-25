/* eslint-env jest */
'use strict';
require('@testing-library/jest-dom/extend-expect');
const React = require('react');

Object.defineProperty(global, 'css', {
	value: () => new Proxy({}, {
		get: (_, property) => property
	})
});

Object.defineProperty(global, 'styled', {
	value: new Proxy((tag) => {
		const TagTemplate = () => (props) => React.createElement(tag, props);

		TagTemplate.attrs = (p) => {
			const fill = (x) => ({...x,...(typeof p === 'function' ? p(x) : p)});
			return () => (props) => React.createElement(tag, fill(props));
		};

		return TagTemplate;
	},{
		get: (_, tag) => global.styled(tag)
	})
});

Object.defineProperty(global, 'matchMedia', {
	writable: true,
	value: jest.fn().mockImplementation(query => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(), // Deprecated
		removeListener: jest.fn(), // Deprecated
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	})),
});
