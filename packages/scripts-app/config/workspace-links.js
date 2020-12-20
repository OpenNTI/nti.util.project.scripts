'use strict';

const paths = require('./paths');

const getWorkspace = require('@nti/lib-scripts/config/workspace');
const workspaceLinks = getWorkspace(paths.packageJson);

module.exports = () => workspaceLinks;
