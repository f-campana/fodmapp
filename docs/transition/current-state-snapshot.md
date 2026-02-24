# Current State Snapshot

Snapshot date: 2026-02-21

## Repository Baseline (`main`)

- Branch status: `main` tracking `origin/main`.
- Monorepo bootstrap is present:
  - `package.json`
  - `pnpm-workspace.yaml` (currently `packages/*`)
  - `turbo.json`
- Types contract package is present:
  - `packages/types/src/generated/v0.ts`
  - `packages/types/src/index.ts`
  - `openapi:generate` and `openapi:check` scripts
- CI includes:
  - `quality` job
  - `openapi-types` stale-check job
  - API jobs unchanged in `api.yml`
- Environment contract docs are present:
  - `.env.example`
  - `infra/ci/ENVIRONMENT.md`

## Completed Transition Fixes

- Path portability for replay/seed scripts is implemented (repo-root resolution, no absolute machine paths).
- Health endpoint DB readiness guard is implemented:
  - `api/app/routers/health.py`
  - `api/tests/test_health.py`

## Unresolved Structural Items

- Rollup refresh still uses drop/recreate snapshot pattern:
  - `etl/phase3/sql/phase3_rollups_compute.sql`
- No migration framework/config is merged in repo yet.
- Evidence artifacts are still physically under `etl/phase2` and `etl/phase3` trees.
- Frontend apps (`apps/app`, `apps/marketing`, `apps/research`) are not yet scaffolded on `main`.

## Isolated Worktree Activity

An isolated architecture worktree exists for UI foundation work:

- Worktree path: `/Users/fabiencampana/Documents/Fodmap-transition-pr2`
- Branch: `codex/transition-pr2-ui-foundation`
- Scope in progress (unmerged):
  - `packages/ui`
  - `apps/storybook`
  - root workspace/task/CI updates for UI checks

This keeps architecture work non-colliding with data-engine changes on `main`.
