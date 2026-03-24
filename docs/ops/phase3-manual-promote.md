# Phase 3 Manual Promote

Status: In progress  
Audience: Maintainer or operator; Contributor or engineer  
Scope: Non-destructive Phase 3 refresh + publish for already-loaded persistent databases.  
Related docs: [docs/ops/dbmate-neon-bootstrap.md](./dbmate-neon-bootstrap.md), [etl/phase3/PRODUCT_LAYER_RUNBOOK.md](../../etl/phase3/PRODUCT_LAYER_RUNBOOK.md), [infra/ci/ENVIRONMENT.md](../../infra/ci/ENVIRONMENT.md)  
Last reviewed: 2026-03-21

## Scope Contract

This operator lane is refresh-only.

It is for a persistent database that already has:

- migrated schema (`dbmate`)
- loaded source/Phase 2 data
- existing Phase 3 traits / rollup / swap inputs
- an existing current `api_v0_phase3` publish release

It does not define first-time persistent bootstrap.

## Commands

Use the repo commands below against the target persistent database in `API_DB_URL`:

```bash
pnpm phase3:promote:check
pnpm phase3:promote
pnpm phase3:promote:status
```

Command contract:

- `API_DB_URL` is the only required DSN
- `PSQL_BIN` is optional and defaults to `psql`
- `phase3:promote` prints a JSON manifest to stdout and supports `--manifest-out <path>`
- the runner does not depend on git state and does not restore or edit review CSVs

## Persistent Refresh Flow

1. Point `API_DB_URL` at the target Neon branch.
2. Run `pnpm db:migrate`.
3. Run `pnpm phase3:promote:check`.
4. Run `pnpm phase3:promote`.
5. Confirm `pnpm phase3:promote:status` shows the new current `publish_id`.
6. Serve the API from the published current views.

## What `phase3:promote` Does

Execution order:

1. preflight checks
2. `phase3_traits_apply.sql`
3. `phase3_safe_harbor_v1_apply.sql`
4. `phase3_safe_harbor_v1_checks.sql`
5. `phase3_rollups_compute.sql`
6. `phase3_rollups_6subtype_checks.sql`
7. `phase3_active_swap_scores_refresh.sql`
8. `phase3_active_swap_scores_checks.sql`
9. `phase3_publish_release_apply.sql`
10. `phase3_publish_release_checks.sql`
11. JSON manifest output

The runner must never:

- drop or recreate the database
- call any `*_activation_apply.sql`
- export or restore review packets
- mutate `swap_rules.status`
- relabel active `swap_rule_scores.scoring_version` snapshots

Promote safety semantics:

- the active swap refresh checks rerun the conservative eligibility gate before publish and fail closed if any active rule worsens severity, worsens burden, resolves to an unknown endpoint, or drops below `fodmap_safety_score=0.500`
- the publish apply + publish checks pair executes inside one transaction in the runner, so a publish-check failure rolls back the new `publish_id` and current-release pointer together

## Failure Policy

- If `dbmate status` is not clean, the runner fails before SQL execution.
- If the database is schema-only, bootstrap-only, or has never produced a current `api_v0_phase3` publish release, `phase3:promote:check` fails with the explicit bootstrap-out-of-scope message.
- If the active safety gate fails after refresh, publish is not attempted.
- If publish apply/checks fail, the runner exits non-zero, rolls back the publish transaction, and still emits a JSON result with the error message.
