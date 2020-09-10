#!/bin/sh
# unset VSCODE_PID
# unset ATOM_HOME
export NODE_ENV=production
for file in $(git diff --diff-filter=d --cached --name-only)
do
	if [[ "$file" =~ \.m?jsx?$ ]]; then
		# only staged changes
		git show ":$file" | npx eslint --stdin --stdin-filename "$file"
		if [ $? -ne 0 ]; then
			exit 1 # exit with failure status
		fi
	fi
done
