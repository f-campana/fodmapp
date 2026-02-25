# Current State Snapshot

Snapshot date: 2026-02-24

## Repository Baseline (`main`)

- Branch status: `main` tracking `origin/main`.
- Monorepo bootstrap is present:
  - `package.json`
  - `pnpm-workspace.yaml` (currently `apps/*` + `packages/*`)
  - `turbo.json`
- Shared frontend foundation is merged on `main`:
  - `packages/ui`
  - `packages/design-tokens`
  - `packages/tailwind-config`
  - `apps/storybook`
- Types contract package is present:
  - `packages/types/src/generated/v0.ts`
  - `packages/types/src/index.ts`
  - `openapi:generate` and `openapi:check` scripts
- CI includes:
  - `quality`
  - `openapi-types` stale-check
  - `design-tokens`
  - `ui-foundation`
  - `api-tests`
  - `api-integration-seeded`
- Environment contract docs are present:
  - `.env.example`
  - `infra/ci/ENVIRONMENT.md`

## Data Engine State (Post Batch C Closeout)

- Merged data-engine increments this cycle:
  - PR #30: Health readiness + Coverage Batch A
  - PR #31: Coverage Batch B
  - PR #32: Batch03 generation + activation
  - PR #51: Coverage Batch C + Batch04 feasibility probe
- Canonical swap-rule state in `fodmap_test`:
  - `phase3_mvp_rule`: 11 active / 1 draft
  - `phase3_batch01_rule`: 7 active / 32 draft
  - `phase3_batch02_rule`: 9 active / 31 draft
  - `phase3_batch03_rule`: 3 active / 11 draft
  - total: 30 active / 75 draft
- Deferred queue blocked on second reviewer:
  - 56 rows (`19 + 26 + 11`)
  - tracked in issue #26
- Coverage status:
  - global `known_subtypes_count=1` bucket = 0
- Batch04 feasibility (non-mutating probe):
  - candidate rows: 10
  - second-review required: 10
  - single-review eligible: 0

## Completed Transition Fixes

- Path portability for replay/seed scripts is implemented (repo-root resolution, no absolute machine paths).
- Health endpoint DB readiness guard is implemented:
  - `api/app/routers/health.py`
  - `api/tests/test_health.py`
- OpenAPI-generated TS contract + stale-check CI is merged.
- UI foundation/token architecture is merged on `main`.

## Unresolved Structural Items

- Rollup refresh still uses drop/recreate snapshot pattern:
  - `etl/phase3/sql/phase3_rollups_compute.sql`
- No migration framework/config (`dbmate`) is merged yet.
- Evidence artifacts remain physically under `etl/phase2` and `etl/phase3` trees.
- Product app shells are not scaffolded yet:
  - `apps/app`
  - `apps/marketing`
  - `apps/research`
- Second-review bottleneck remains external and blocks deferred activation throughput.

## Worktree Usage

- No active requirement for the previous UI-foundation isolated worktree; that scope is merged.
- For future concurrent tracks, continue using dedicated worktrees to keep data-engine and product/frontend changes isolated.
