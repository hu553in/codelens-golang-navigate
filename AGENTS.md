# Project rules

## General

- Please ask questions before making any changes if you have any doubts about anything.

## Checking

- Always use commands from `package.json` scripts for checking and fixing issues.

## git

- Always check staged and unstaged changes before doing any work to have a clear context.
- Don't stage or unstage any changes, and don't do any commits until explicitly asked.

## Docs

- In any Markdown file, keep the max line length to 120 (excluding tables, long links or code blocks, etc.)
- After making any changes to the project, ensure the existing docs are updated:
  - `AGENTS.md`
  - `README.md`
  - code comments

## Code conventions

- Follow defined code style rules (see `.eslint.config.mjs` and `.prettierrc`).
- Verify everything via `pnpm run check`.
