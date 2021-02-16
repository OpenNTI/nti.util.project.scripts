'use strict';
const { spawnSync } = require('child_process');
const semver = require('semver');

module.exports = function getVersion(cmd) {
	const { stdout: buf } = spawnSync(cmd, ['-v']);
	return !buf ? null : semver.clean(buf.toString('utf8'));
};
