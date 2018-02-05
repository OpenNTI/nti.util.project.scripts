#!/usr/bin/env node
'use strict';
const {spawnSync} = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const semver = require('semver');
const tmp = require('tmp');

const args = process.argv.slice(2);
const source = process.cwd();
const bin = path.join(__dirname, 'node_modules/.bin/jsdoc');
const config = path.join(__dirname, 'jsdoc.json');
const template = path.dirname(require.resolve('minami'));

const {opts: {destination} = {}} = fs.readJsonSync(config) || {};
const output = path.resolve(source, destination || '');

if (typeof destination !== 'string' || !output.startsWith(source)) {
	console.log('Invalid destination');
	process.exit(1);
}

const packageLocationOverride = [];
const pkg = fs.readJsonSync(path.resolve(source, 'package.json'));
const version = semver.parse(pkg.version);

//replace snapshot docs
if (version.prerelease.length > 1) {
	const {name: tmpFile} = tmp.fileSync();

	version.prerelease.pop();
	pkg.version = version.format();

	fs.writeJsonSync(tmpFile, pkg);
	packageLocationOverride.push('--package', tmpFile);
}


spawnSync(bin,
	[
		// '--debug',
		// '--verbose',
		'--configure', config,
		'--template', template,
		...packageLocationOverride,
		...args,
		source
	],
	{ stdio: 'inherit' });


if (process.env.CI) {
	//transfer docs


	//cleanup docs
	fs.removeSync(output);
}
