//Cleans the workspace by removing the modules and reports directories
'use strict';
const fs = require('fs-extra');
const path = require('path');
const { cwd } = require('./util');

const modulesDir = path.join(cwd, 'node_modules');
const reportsDir = path.join(cwd, 'reports');

fs.remove(modulesDir);
fs.remove(reportsDir);
