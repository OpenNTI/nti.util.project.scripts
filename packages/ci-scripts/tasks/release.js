// release
'use strict';
const {call} = require('./util');

call('npx @nti/ci-scripts@micro clean');

call('npx @nti/ci-scripts@micro ci');

call('npx @nti/ci-scripts@micro publish');
