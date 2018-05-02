// smoketests
'use strict';

const { printHeader, getPackageNameAndVersion } = require('./util');
const { name, version } = getPackageNameAndVersion();
printHeader('Preparing smoketest build:\n  %s@%s', name, version);

require('./clean');

require('./prepare');

require('./install');

require('./pack');
