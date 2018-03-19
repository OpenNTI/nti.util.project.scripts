// smoketests
'use strict';
const {prepare, call, nofail} = require('./util/prepare');

const {version, stamp} = prepare('snapshot');

// Update the package(-lock).json to a snapshot version
call(`npm --no-git-tag-version version ${version}.${stamp}`);
//publish the snapshot (will build)
call('npm publish --tag alpha');

call('git tag --delete snapshot', nofail);
call('git tag snapshot');
call('git push origin tag snapshot -f');
