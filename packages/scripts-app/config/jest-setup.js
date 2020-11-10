'use strict';
const React = require('react');

Object.assign(global, {
	css: () => new Proxy({}, {
		get: (_, property) => property
	}),

	styled: new Proxy((tag) => {
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
