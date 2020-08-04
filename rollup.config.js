import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import shebang from 'rollup-plugin-preserve-shebang';
import builtins from 'builtin-modules';

export default {
	input: './index.js',
	output: {
		file: './index.js',
		format: 'es'
	},
	external: builtins,
	onwarn (warning, warn) {
		const skip = {
			// skip certain warnings
			CIRCULAR_DEPENDENCY: true,
			UNUSED_EXTERNAL_IMPORT: true,
		};

		if (skip[warning.code]) { return; }

		console.log(warning.code);
		// Use default for everything else
		warn(warning);
	},
	plugins: [
		shebang(),
		resolve({
			mainFields: ['main'],
			preferBuiltins: true
		}),
		commonjs(),
		json(),
	]
};
