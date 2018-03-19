'use strict';
const path = require('path');
const fs = require('fs-extra');
const semver = require('semver');
const tmp = require('tmp');

exports.getPackageJson = () => {

	const source = process.cwd();
	const packageJson = path.resolve(source, 'package.json');
	const pkg = fs.readJsonSync(packageJson);
	const version = semver.parse(pkg.version);

	//replace snapshot docs
	if (version.prerelease.length > 1) {
		const {name: tmpFile} = tmp.fileSync();

		version.prerelease.pop();
		pkg.version = version.format();

		fs.writeJsonSync(tmpFile, pkg);
		return tmpFile;
	}

	return null; //use default
};

exports.getPackageIdentifier = () => {
	const source = process.cwd();
	const packageJson = path.resolve(source, 'package.json');
	const pkg = fs.readJsonSync(packageJson);
	const version = semver.parse(pkg.version);

	//replace snapshot docs
	if (version.prerelease.length > 1) {
		version.prerelease.pop();
		pkg.version = version.format();
	}

	return `${pkg.name}/${pkg.version}`;
};
