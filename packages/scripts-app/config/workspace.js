'use strict';

const paths = require('./paths');

const getWorkspace = require('@nti/lib-scripts/config/workspace');
const workspace = getWorkspace(paths.packageJson);

module.exports = () => workspace;
