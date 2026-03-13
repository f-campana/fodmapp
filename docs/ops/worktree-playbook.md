# Worktree Playbook

Use this flow for repository work in dedicated worktrees so concurrent tracks stay reviewable and
do not collide.

## Create Isolated Worktree

```bash
git fetch origin --prune
git worktree add -b codex/<short-topic> /Users/fabiencampana/Documents/Fodmap-<short-topic> origin/main
cd /Users/fabiencampana/Documents/Fodmap-<short-topic>
git status -sb
```

## Working Rules

- Keep branch names prefixed with `codex/`.
- Register the worktree, branch, scope, and blockers in `docs/ops/worktree-status.md`.
- Keep scope to one concern per PR.
- Do not include unrelated ETL/schema rewrites in frontend or docs PRs.
- Keep `/Users/fabiencampana/Documents/fodmapp` clean at all times.
- Run the full quality gate before proposing merge.

## Pre-Merge Validation

```bash
./.github/scripts/quality-gate.sh --full
pnpm install --frozen-lockfile
pnpm openapi:check
pytest -m "not integration" api/tests
```

Add package-specific commands depending on PR scope (e.g., UI/Storybook checks).

## Worktree Hygiene

- Keep each worktree focused on one branch.
- If paused, leave branch/worktree intact and documented.
- If merged, update `docs/ops/worktree-status.md` before removing local leftovers.
- If completed and merged:

```bash
cd /Users/fabiencampana/Documents/fodmapp
git worktree remove /Users/fabiencampana/Documents/Fodmap-<short-topic>
git branch -d codex/<short-topic>
```
