#!/bin/sh
unset VSCODE_PID
unset ATOM_HOME
set -e
export NODE_ENV=production

for i in $(git diff --diff-filter=d --cached --name-only);
do
	if [[ $i =~ (([cm]?jsx?)|(s?[ca]ss))$ ]]; then
		npx --no-install @nti/pre-commit;
		break;
	fi
done
