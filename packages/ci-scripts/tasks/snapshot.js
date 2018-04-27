// snapshot
'use strict';
const {call} = require('./util');

call('npx @nti/ci-scripts@micro clean');

call('npx @nti/ci-scripts@micro prepare');

call('npx @nti/ci-scripts@micro install');

call('npx @nti/ci-scripts@micro publish');
