'use strict';
const path = require('path');

const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const eslint = require('rollup-plugin-eslint');

const paths = require('./paths');
const lintConfig = paths.exists(
	path.resolve(paths.path, '.eslintrc'),
	path.resolve(paths.ownPath,'./config/eslintrc.js')
);

const pkg = require(paths.packageJson);
const externals = [
	Object.keys(pkg.dependencies || {}),
	Object.keys(pkg.devDependencies || {}),
	Object.keys(pkg.optionalDependencies || {})
].reduce((a, d) => [...a, ...d], []);

const outputs = [
	{format: 'cjs', dest: path.resolve(paths.path, pkg.main)},
	pkg.module && {format: 'es', dest: path.resolve(paths.path, pkg.module)}
].filter(Boolean);


module.exports = {
	outputs,
	config: {
		entry: path.resolve(paths.src, 'index.js'),
		format: outputs[0].format,
		dest: outputs[0].dest,
		sourceMap: true,
		exports: 'named',
		external: externals,
		plugins: [
			eslint({
				baseConfig: false,
				configFile: lintConfig,
				throwError: true
			}),
			babel({ exclude: 'node_modules/**' }),
			commonjs({
				ignoreGlobal: true
			}),
			json()
		]
	}
};
