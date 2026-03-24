# Phase 3 Initial Persistent Bootstrap

Status: Implemented on main  
Audience: Maintainer or operator  
Scope: First-time Phase 2 / Phase 3 data load for a dbmate-migrated persistent database.

Last reviewed: 2026-03-22

## Purpose

`pnpm phase3:bootstrap` is the missing first-load operator path for a long-lived Neon database.

It is intentionally narrower than replay:

- schema-only databases only
- explicit CIQUAL files only
- no database drop/recreate
- no tracked review CSV mutation
- no git restore

After bootstrap completes successfully, steady-state refresh moves to `pnpm phase3:promote`.

## Commands

From the repository root:

```bash
pnpm phase3:bootstrap:check
pnpm phase3:bootstrap
pnpm phase3:bootstrap:status
```

The runner executes through `api/scripts/phase3_bootstrap.py`.

## Required Inputs

- `API_DB_URL`
- CIQUAL files via either:
  - `CIQUAL_XLSX`, `CIQUAL_ALIM_XML`, `CIQUAL_GRP_XML`, or
  - `CIQUAL_DATA_DIR` defaults under `etl/ciqual/data/raw`

Optional:

- `PSQL_BIN`

## Preconditions

- `pnpm db:migrate` has already run on the target database
- the database is schema-only for bootstrap purposes:
  - no CIQUAL-loaded foods
  - no Phase 2 resolved rows
  - no Phase 3 traits / safe-harbor assignments / swap rules / publish state
- committed MVP review decisions remain available at:
  - `etl/phase3/decisions/phase3_swap_activation_review_v1.csv`

The runner fails clearly if the target is partially loaded or already bootstrapped.

## Execution Order

`pnpm phase3:bootstrap` runs:

1. preflight checks
2. CIQUAL load
3. Phase 2 replay SQL chain without DB recreate or schema apply
4. traits apply
5. safe-harbor apply + checks
6. rollup compute + checks
7. swap draft materialization
8. Gate A rescore to a temporary review export
9. temporary reviewed-packet synthesis from the committed MVP decisions
10. Gate B activation apply + checks against the temporary reviewed packet
11. MVP checks
12. publish apply + checks
13. JSON manifest/status summary

## Temporary Review Packet Contract

Bootstrap does not edit tracked review CSVs.

Instead it:

- exports Gate A output to a temporary file
- overlays committed `review_decision`, `review_notes`, `reviewed_by`, and `reviewed_at`
- feeds the synthesized packet into Gate B through `PHASE3_REVIEW_CSV_PATH`

The same temporary-packet mechanism is reused in `etl/phase3/scripts/phase3_seed_for_api_ci.sh`.

## Success Criteria

On a fresh dbmate-migrated schema-only database, the expected first-load result is:

- `42` resolved Phase 2 priority rows
- `42` published rollups
- `252` published subtype rows
- `11` published active swaps
- `11` active MVP rules
- `1` draft MVP rule
- one current `api_v0_phase3` publish release

## Handoff

After bootstrap succeeds:

1. run `pnpm phase3:promote:check`
2. use `pnpm phase3:promote` for later refreshes
3. only then continue toward hosted activation
