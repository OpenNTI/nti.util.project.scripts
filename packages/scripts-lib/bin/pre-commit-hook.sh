#!/bin/sh
# unset VSCODE_PID
# unset ATOM_HOME
set -e
export NODE_ENV=production
npx @nti/pre-commit
