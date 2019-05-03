// release
'use strict';

const { printHeader, getPackageNameAndVersion } = require('./util');
const { name, version } = getPackageNameAndVersion();
printHeader('Preparing release build:\n  %s@%s', name, version);

require('./clean');

require('./install');

require('./publish');
