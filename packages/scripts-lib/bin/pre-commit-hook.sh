#!/bin/sh
# unset VSCODE_PID
# unset ATOM_HOME
set -e
export NODE_ENV=production
JS=$(git diff --diff-filter=d --cached --name-only ***.{cjs,js,jsx,mjs})
if [[ ! -z "$JS" ]]; then
	npx --yes @nti/pre-commit
fi
