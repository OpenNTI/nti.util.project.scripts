/*eslint import/no-extraneous-dependencies: 0*/
'use strict';
const path = require('path');
const fs = require('fs-extra');

const callHook = require('@nti/app-scripts/tasks/utils/build-call-hook');
const noCjs = require('../templates/no-cjs');
const paths = require('../config/paths');

global.runBuild = async function build () {
	//clean dist
	await fs.emptyDir(path.resolve(paths.path, 'lib'));

	//call build hook
	await callHook();

	noCjs();
};

require('@nti/lib-scripts/tasks/build');
