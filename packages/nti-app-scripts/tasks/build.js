'use strict';
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
//Expose unhandled rejected promises.
process.on('unhandledRejection', err => { throw err; });

const path = require('path');
// const chalk = require('chalk');
const fs = require('fs-extra');
const call = require('nti-lib-scripts/tasks/utils/call-cmd');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const paths = require('../config/paths');

const copyServerCode = require('./utils/build-copy-server-code');
const copyStaticAssets = require('./utils/build-copy-static-assets');
const updateLibraryReferences = require('./utils/build-update-library-references');
const recordVersions = require('./utils/build-record-versions');
const buildBundle = require('./utils/build-webpack');

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
	process.exit(1);
}

call('node', [require.resolve('./check')]);
call('node', [require.resolve('./test')]);

//clean dist & ensure client/server directories
fs.emptyDirSync(path.resolve(paths.path, 'dist'));
fs.ensureDirSync(path.resolve(paths.path, 'dist/client'));
fs.ensureDirSync(path.resolve(paths.path, 'dist/server'));

//Copy server code...
copyServerCode();

//Generate static assets...
//TODO: fill in

//Copy Static assets...
copyStaticAssets();

//Update React library references...
updateLibraryReferences();

// Run webpack...
buildBundle();

//record versions
recordVersions();
