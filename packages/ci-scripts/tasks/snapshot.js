// snapshot
'use strict';

const { printLine, printHeader, getPackageNameAndVersion } = require('./util');
const { name, version } = getPackageNameAndVersion();
printLine('::group::Preparing snapshot build')
printHeader('Preparing snapshot build:\n  %s@%s', name, version);
printLine('::endgroup::')

require('./clean');

require('./prepare');

require('./install');

require('./publish');
