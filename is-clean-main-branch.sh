#!/usr/bin/env bash

REQUIRED_BRANCH="main"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [[ "$CURRENT_BRANCH" != "$REQUIRED_BRANCH" ]]; then
  echo "Error: Not on branch '$REQUIRED_BRANCH'!" >&2
  exit 1
fi

if output=$(git status --porcelain) && [ -n "$output" ]; then
  echo "Error: Working tree is not clean!" >&2
  git status --short >&2
  exit 1
fi

echo "OK: On '$REQUIRED_BRANCH' branch and working tree is clean."
