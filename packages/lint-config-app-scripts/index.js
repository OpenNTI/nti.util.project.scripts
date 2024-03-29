'use strict';
const { join } = require('path');
const fs = require('fs');
const {
	DEV,
	IN_IDE,
	IN_WEBPACK,
} = require('@nti/eslint-config-lib-scripts/vars');
const configFile = join(
	__dirname,
	`config.${DEV ? 'dev' : 'prod'}${IN_IDE ? '.ide' : ''}${
		IN_WEBPACK ? '.webpack' : ''
	}.json`
);

try {
	module.exports = require(configFile);
	if (!DEV || fs.statSync(__filename).mtime > fs.statSync(configFile).mtime) {
		throw new Error('Recompute');
	}
} catch {
	const config = computeConfig();
	fs.writeFileSync(configFile, JSON.stringify(config, null, 2), {
		encoding: 'utf-8',
	});
	module.exports = config;
}

function computeConfig() {
	const { find, resolve } = require('@nti/eslint-config-lib-scripts/resolve');

	function getReactVersion() {
		try {
			return require('react/package.json').version;
		} catch (e) {
			return '16.2.0';
		}
	}

	return {
		root: true,
		extends: [
			'@nti/eslint-config-lib-scripts',
			'plugin:react/recommended',
			'plugin:react/jsx-runtime',
			'prettier',
		],

		settings: {
			'import/extensions': ['.js', '.mjs', '.jsx'],
			'import/internal-regex': '^(@nti|internal)\\/',
			'import/resolver': {
				[require.resolve('./node-query-resolver')]: {
					extensions: ['.js', '.mjs', '.jsx'],
					moduleDirectory: ['node_modules'],
					paths: [find(join('node_modules', '@nti'))],
				},
			},
			react: {
				pragma: 'React',
				version: getReactVersion(),
			},
		},

		globals: {
			// '$AppConfig': 'readonly',

			//Global Template Literal Tags:
			css: 'readonly',
			styled: 'readonly',
			stylesheet: 'readonly',
		},

		rules: {
			'import/named': 'off',
			'import/no-extraneous-dependencies': !IN_IDE
				? 'off'
				: [
						'error',
						{
							bundledDependencies: true,
							devDependencies: true,
							packageDir: [
								'.',
								resolve('@nti/app-scripts'),
								resolve('@nti/cmp-scripts'),
								resolve('@nti/lib-scripts'),
							].filter(Boolean),
						},
				  ],

			//We standardize on using double quotes on JSX props since they look like HTML attributes.
			//See: http://eslint.org/docs/rules/jsx-quotes
			'jsx-quotes': ['warn', 'prefer-double'],

			'react/no-children-prop': ['off'],
			'react/no-deprecated': ['warn'],
			'react/no-typos': ['error'],
			'react/destructuring-assignment': ['off'],

			//See: https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-pascal-case.md
			'react/jsx-pascal-case': ['warn', { allowAllCaps: true }],

			// This is NOT an error.
			'react/display-name': ['off'],

			// Do not require prop-type validation for very common props provided by the system.
			'react/prop-types': [
				'warn',
				{ ignore: ['children', 'className'], skipUndeclared: true },
			],
		},
	};
}
