'use strict';
const path = require('path');

const babel = require('rollup-plugin-babel');
// const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const eslint = require('rollup-plugin-eslint');
const resolve = require('rollup-plugin-node-resolve');
const string = require('rollup-plugin-string');
const image = require('rollup-plugin-img');

const paths = require('./paths');
const lintConfig = paths.exists(
	path.resolve(paths.path, '.eslintrc'),
	path.resolve(paths.ownPath,'./config/eslintrc.js')
);

const NODE_BUILTINS = [
	'child_process',
	'cluster',
	'crypto',
	'dns',
	'events',
	'fs',
	'http',
	'https',
	'inspector',
	'net',
	'os',
	'path',
	'querystring',
	'readline',
	'repl',
	'stream',
	'string_decoder',
	'timers',
	'tls',
	'tty',
	'dgram',
	'url',
	'util',
	'v8',
	'vm',
	'zlib'
];

const pkg = require(paths.packageJson);
const externals = [
	NODE_BUILTINS,
	Object.keys(pkg.dependencies || {}),
	Object.keys(pkg.devDependencies || {}),
	Object.keys(pkg.optionalDependencies || {})
].reduce((a, d) => [...a, ...d], []);

const outputs = [
	{format: 'cjs', dest: path.resolve(paths.path, pkg.main)},
	pkg.module && {format: 'es', dest: path.resolve(paths.path, pkg.module)}
].filter(Boolean);


function isExternal (id) {
	return id[0] !== '.' && externals.some(x => id.startsWith(x));
}


module.exports = {
	outputs,
	config: {
		entry: path.resolve(paths.src, 'index.js'),
		format: outputs[0].format,
		dest: outputs[0].dest,
		sourceMap: true,
		exports: 'named',
		external: isExternal,
		plugins: [
			resolve({
				extensions: [ '.js', '.jsx' ],
				modulesOnly: true,
			}),
			eslint({
				baseConfig: false,
				configFile: lintConfig,
				throwOnError: true
			}),
			babel({ exclude: 'node_modules/**' }),
			// commonjs({ ignoreGlobal: true }),
			json(),
			string({
				include: '**/*.svg',
			}),
			image()
		]
	}
};
