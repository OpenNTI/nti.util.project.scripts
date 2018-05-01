'use strict';

const { call, printHeader, getPackageNameAndVersion } = require('./util');

const { name, version } = getPackageNameAndVersion();
printHeader('Publishing package: \n %s@s', name, version);

call('npm publish');

console.log('npm publish completed');
