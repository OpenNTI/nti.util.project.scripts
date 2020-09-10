'use strict';
const { execSync } = require('child_process');
const { mkdirSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
require('./validate-env.js');

const exec = x => execSync(x).toString('utf8').trim();

const hooks = join(exec('git rev-parse --show-toplevel'), '.git', 'hooks');
const hookDst = join(hooks, 'pre-commit');
const hookSrc = join(__dirname, 'pre-commit-hook.sh');

const hookContent = readFileSync(hookSrc);
mkdirSync(hooks, {recursive: true});
writeFileSync(hookDst, hookContent, {mode: 0o777});
