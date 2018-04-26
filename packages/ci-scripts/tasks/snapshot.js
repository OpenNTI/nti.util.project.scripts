// smoketests
'use strict';
const {prepare, call, nofail} = require('./util/prepare');
const silent = {fd:'ignore'};

// Update the package(-lock).json to a snapshot version
call(`npm --no-git-tag-version version ${version}.${stamp}`, silent);
//publish the snapshot (will build)
call('npm publish --tag alpha');

call('git tag snapshot -f', nofail);
call('git push origin tag snapshot -f', silent);
