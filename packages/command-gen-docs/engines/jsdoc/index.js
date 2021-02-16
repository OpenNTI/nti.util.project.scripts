#!/usr/bin/env node
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const { getPackageJson, getReadMe } = require('../util');

module.exports = function run() {
	const args = process.argv.slice(2);
	const source = process.cwd();
	const bin = path.resolve(__dirname, '../../node_modules/.bin/jsdoc');
	const config = path.join(__dirname, 'jsdoc.json');
	const template = path.dirname(require.resolve('minami'));

	const { opts: { destination } = {} } = fs.readJsonSync(config) || {};
	const output = path.resolve(source, destination || '');

	if (typeof destination !== 'string' || !output.startsWith(source)) {
		console.log('Invalid destination');
		process.exit(1);
	}

	const packageLocationOverride = [];
	const packageJson = getPackageJson();

	//replace snapshot docs
	if (packageJson != null) {
		packageLocationOverride.push('--package', packageJson);
	}

	const readMeLocation = [];
	const readme = getReadMe();
	if (readme) {
		readMeLocation.push('--readme', readme);
	}

	spawnSync(
		'node',
		[
			'--max-old-space-size=8192',
			bin,
			// '--debug',
			// '--verbose',
			...readMeLocation,
			'--configure',
			config,
			'--template',
			template,
			...packageLocationOverride,
			...args,
			source,
		],
		{ stdio: 'inherit' }
	);

	return output;
};
