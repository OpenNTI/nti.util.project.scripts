'use strict';
//Update package.json:
// 1) remove our deps from devdeps.
// 2) add ourselves as dev deps
// 3) remove jest, jest-junit keys.
// 4) update scripts:
// 	a) unset 'preversion', 'postversion', 'bump', 'prebump', 'postbump'
// 	b) set "test": "nti-lib-scripts test"
// 	c) set "start": "nti-lib-scripts test --watch"
// 	d) set "prepublish": "nti-lib-scripts build"

//Replace .babelrc, .editorconfig, .eslintignore, .eslintrc, .npmignore
//Remove rollup.config.js, karma.config.js, Makefile
//Remove '/test' dir
