// snapshot
'use strict';

const { printHeader, getPackageNameAndVersion } = require('./util');
const { name, version } = getPackageNameAndVersion();
printHeader('Preparing snapshot build:\n  %s@%s', name, version);

require('./clean');

require('./prepare');

require('./install');

require('./publish');
