'use strict';
const path = require('path');

const babel = require('rollup-plugin-babel');
// const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const { eslint } = require('rollup-plugin-eslint');
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
	'babel-runtime',
	NODE_BUILTINS,
	Object.keys(pkg.dependencies || {}),
	Object.keys(pkg.devDependencies || {}),
	Object.keys(pkg.optionalDependencies || {})
].reduce((a, d) => [...a, ...d], []);

const outputs = [
	{format: 'cjs', file: path.resolve(paths.path, pkg.main)},
	pkg.module && {format: 'es', file: path.resolve(paths.path, pkg.module)}
]
	.filter(Boolean)
	.map(x => Object.assign(x, {
		sourcemap: true,
		exports: 'named'
	}));


function isExternal (id) {
	return id[0] !== '.' && externals.some(x => id.startsWith(x));
}


module.exports = {
	outputs,
	config: {
		input: path.resolve(paths.src, 'index.js'),
		output: outputs,
		external: isExternal,
		plugins: [
			resolve({
				extensions: [ '.js', '.jsx', '.mjs' ],
				modulesOnly: true,
			}),
			eslint({
				exclude: 'node_modules/**',
				include: [
					'**/*.js',
					'**/*.jsx',
					'**/*.mjs'
				],
				baseConfig: false,
				configFile: lintConfig,
				throwOnError: true
			}),
			babel({
				runtimeHelpers: true,
				exclude: ['node_modules/**', '**/*.template.svg']
			}),
			// commonjs({ ignoreGlobal: true }),
			json(),
			string({
				include: '**/*.template.svg',
			}),
			image({
				output: path.resolve(path.resolve(paths.path, pkg.main), '../images'),
				extensions: /\.(png|jpg|jpeg|gif|svg)$/,
				exclude: ['**/*.template.svg'],
			})
		]
	}
};
