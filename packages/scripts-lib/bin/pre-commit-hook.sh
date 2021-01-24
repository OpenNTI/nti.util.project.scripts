#!/bin/sh
# unset VSCODE_PID
# unset ATOM_HOME
set -e
export NODE_ENV=production
CODE=$(git diff --diff-filter=d --cached --name-only ***.{cjs,js,jsx,mjs,css,scss,sass})
if [[ ! -z "$CODE" ]]; then
	npx --no-install @nti/pre-commit
fi
