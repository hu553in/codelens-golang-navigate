#!/usr/bin/env bash

REQUIRED_PERCENTAGE=90

jq -e '
    .total.lines.pct >= '"${REQUIRED_PERCENTAGE}"' and
    .total.functions.pct >= '"${REQUIRED_PERCENTAGE}"' and
    .total.branches.pct >= '"${REQUIRED_PERCENTAGE}"' and
    .total.statements.pct >= '"${REQUIRED_PERCENTAGE}"'
' coverage/coverage-summary.json || exit 1
