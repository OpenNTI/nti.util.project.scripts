#!/bin/bash
if [ -f .git/hooks/prepare-commit-msg ]; then
    .git/hooks/prepare-commit-msg
    exit
fi

if [ -z "$BRANCHES_TO_SKIP" ]; then
  BRANCHES_TO_SKIP=(master develop test)
fi

BRANCH_NAME=$(git symbolic-ref -q --short HEAD)
BRANCH_MAINT=$(echo $BRANCH_NAME | grep -c "^maint-")

BRANCH_NAME="${BRANCH_NAME##*/}"
TICKET_NAME=$(echo $BRANCH_NAME | sed -e 's/^[^\/]*\/\([^-]*-[^-]*\)-.*/\1/' | grep -E -o "^[A-Z0-9,\.\_\-]+-[0-9]+$")

BRANCH_EXCLUDED=$(printf "%s\n" "${BRANCHES_TO_SKIP[@]}" | grep -c "^$BRANCH_NAME$")
ALREADY_IN_MSG=$(grep -c "$TICKET_NAME" $1)

if [ -n "$TICKET_NAME" ] && ! [[ $BRANCH_MAINT -eq 1 ]] && ! [[ $BRANCH_EXCLUDED -eq 1 ]] && ! [[ $ALREADY_IN_MSG -ge 1 ]]; then
  sed -i.bak -e "1s/^/[$TICKET_NAME] /" $1
fi
