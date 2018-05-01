//Cleans the workspace by removing the modules and reports directories
'use strict';
const fs = require('fs-extra');
const path = require('path');

const { printHeader, getPackageNameAndVersion } = require('./util');

const { name, version } = getPackageNameAndVersion();
printHeader('Cleaning directory: \n %s@s', name, version);

const cwd = process.cwd();
console.log('Deleting node_modules directory');
const modulesDir = path.join(cwd, 'node_modules');
console.log('Deleting reports directory');
const reportsDir = path.join(cwd, 'reports');

fs.removeSync(modulesDir);
fs.removeSync(reportsDir);

console.log('Directory cleaned');
