'use strict';

const {PROD} = require('./env');
const paths = require('./paths');

const getWorkspace = require('@nti/lib-scripts/config/workspace');
const workspaceLinks = () => (!PROD && paths.workspace)
	? getWorkspace(paths.workspace, paths.packageJson)
	: {};

module.exports = workspaceLinks;
