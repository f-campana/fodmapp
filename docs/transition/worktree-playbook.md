# Worktree Playbook

Use this flow for architecture PRs to avoid collisions with data-engine work.

## Create Isolated Worktree

```bash
git fetch origin --prune
git worktree add -b codex/<short-topic> /Users/fabiencampana/Documents/Fodmap-<short-topic> origin/main
cd /Users/fabiencampana/Documents/Fodmap-<short-topic>
git status -sb
```

## Working Rules

- Keep branch names prefixed with `codex/`.
- Keep scope to one concern per PR.
- Do not include unrelated ETL/schema rewrites in frontend PRs.
- Run quality checks before proposing merge.

## Pre-Merge Validation

```bash
./.github/scripts/quality-gate.sh
pnpm install --frozen-lockfile
pnpm openapi:check
pytest -m "not integration" api/tests
```

Add package-specific commands depending on PR scope (e.g., UI/Storybook checks).

## Worktree Hygiene

- Keep each worktree focused on one branch.
- If paused, leave branch/worktree intact and documented.
- If completed and merged:

```bash
cd /Users/fabiencampana/Documents/Fodmap
git worktree remove /Users/fabiencampana/Documents/Fodmap-<short-topic>
git branch -d codex/<short-topic>
```
