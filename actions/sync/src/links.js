'use strict';

Object.assign(exports, {
	links,
});

function links (str) {
	return !str ? {} : str.split(',').reduce((o,x) => {
		const [,link,rel] = x.trim().match(/<([^>]+)>.+rel=(.+?)$/i);
		o[rel.replace(/["']/g,'').trim()] = link;
		return o;
	}, {});
}

