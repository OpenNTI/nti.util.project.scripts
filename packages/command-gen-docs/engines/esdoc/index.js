#!/usr/bin/env node
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const tmp = require('tmp');
const { getPackageJson, getPackageIdentifier } = require('../util');

module.exports = function run() {
	const args = process.argv.slice(2);
	const source = process.cwd();
	const bin = path.resolve(__dirname, '../../node_modules/.bin/esdoc');
	let config = path.join(__dirname, 'esdoc.json');

	const cfg = fs.readJsonSync(config) || {};
	const { destination } = cfg;
	const output = path.resolve(source, destination || '');

	if (typeof destination !== 'string' || !output.startsWith(source)) {
		console.log('Invalid destination: ', output, destination);
		process.exit(1);
	}

	const packageJson = getPackageJson();
	const { name: tmpFile } = tmp.fileSync();

	cfg.destination = path.resolve(source, destination, getPackageIdentifier());
	if (packageJson != null) {
		cfg.package = packageJson;
	}

	fs.writeJsonSync(tmpFile, cfg);
	config = tmpFile;

	spawnSync(
		'node',
		[
			'--max-old-space-size=8192',
			bin,
			// '--debug',
			// '--verbose',
			'-c',
			config,
			...args,
		],
		{ stdio: 'inherit' }
	);

	return output;
};
