'use strict';
const path = require('path');

const { babel } = require('@rollup/plugin-babel');
// const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const { eslint } = require('rollup-plugin-eslint');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { string } = require('rollup-plugin-string');
const image = require('rollup-plugin-img');

const paths = require('./paths');
const resolveScriptDir = require('./resolve-script-dir');
const lintConfig = paths.exists(
	path.resolve(paths.path, '.eslintrc'),
	path.join(resolveScriptDir(), 'config', './config/eslintrc.js')
);

const pkg = require(paths.packageJson);

const outputs = [
	{format: 'cjs', file: path.resolve(paths.path, pkg.main)},
	// pkg.module && {format: 'es', file: path.resolve(paths.path, pkg.module)}
]
	.filter(Boolean)
	.map(x => Object.assign(x, {
		sourcemap: true,
		exports: 'named'
	}));


function isExternal (id) {
	return id[0] !== '.' && !id.startsWith(paths.src);
}


module.exports = {
	outputs,
	config: {
		input: path.resolve(paths.src, 'index.js'),
		output: outputs,
		external: isExternal,
		plugins: [
			nodeResolve({
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
				configFile: path.join(resolveScriptDir(), 'config', 'babel.config.js'),
				babelrc: false,
				exclude: 'node_modules/**'
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
