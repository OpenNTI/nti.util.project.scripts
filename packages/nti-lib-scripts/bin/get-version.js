'use strict';
const semver = require('semver');
const spawn = require('cross-spawn');


module.exports = function getVersion (cmd) {
	const {stdout: buf} = spawn.sync(cmd, ['-v']);
	return !buf ? null : semver.clean(buf.toString('utf8'));
};
