'use strict';
const path = require('path');
const fs = require('fs-extra');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');

const callHook = require('./utils/build-call-hook');
const copyServerCode = require('./utils/build-copy-server-code');
const copyStaticAssets = require('./utils/build-copy-static-assets');
const recordVersions = require('./utils/build-record-versions');
const buildBundle = require('./utils/build-webpack');

const paths = require('../config/paths');

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
	process.exit(1);
}

global.runBuild = async function () {
	//clean dist & ensure client/server directories
	await fs.emptyDir(path.resolve(paths.path, 'dist'));
	await fs.ensureDir(path.resolve(paths.path, 'dist/client'));
	await fs.ensureDir(path.resolve(paths.path, 'dist/server'));

	//record versions (don't block on this)
	const p = recordVersions();

	//Copy server code...
	await copyServerCode();

	//call build hook
	await callHook();

	//Copy Static assets...
	await copyStaticAssets();

	// Run webpack...
	await buildBundle();

	await p;
};

require('@nti/lib-scripts/tasks/build');
