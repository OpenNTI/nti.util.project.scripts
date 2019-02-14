'use strict';
const SKIP = process.argv.includes('--skip-checks');
const DEBUG = process.argv.includes('--debug');
process.env.BABEL_ENV = DEBUG ? 'development' : 'production';
process.env.NODE_ENV = DEBUG ? 'development' : 'production';
//Expose unhandled rejected promises.
process.on('unhandledRejection', err => { throw err; });

const path = require('path');
// const chalk = require('chalk');
const fs = require('fs-extra');
const call = require('@nti/lib-scripts/tasks/utils/call-cmd');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const paths = require('../config/paths');

const copyServerCode = require('./utils/build-copy-server-code');
const callHook = require('./utils/build-call-hook');
const copyStaticAssets = require('./utils/build-copy-static-assets');
const recordVersions = require('./utils/build-record-versions');
const buildBundle = require('./utils/build-webpack');

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
	process.exit(1);
}


if (!SKIP) {
	call('node', [require.resolve('./check')]);
	call('node', [require.resolve('./test')]);
}

//clean dist & ensure client/server directories
fs.emptyDirSync(path.resolve(paths.path, 'dist'));
fs.ensureDirSync(path.resolve(paths.path, 'dist/client'));
fs.ensureDirSync(path.resolve(paths.path, 'dist/server'));

if (!SKIP) {
	console.log('\nGenerating docs...\n');
	call('npx', ['--quiet', '@nti/gen-docs']);
}

(async function () {
	//Copy server code...
	await copyServerCode();

	//call build hook
	await callHook();

	//Copy Static assets...
	await copyStaticAssets();

	// Run webpack...
	await buildBundle();

	//record versions
	await recordVersions();
}());
