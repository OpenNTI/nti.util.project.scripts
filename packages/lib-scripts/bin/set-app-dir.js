'use strict';
const {resolveAppDir} = require('./resolve-app-dir');
process.chdir(resolveAppDir(process.cwd()), /^@nti\/(.+)-scripts$/);
