# DBMate + Neon Bootstrap

Status: In progress  
Audience: Maintainer or operator; Contributor or engineer  
Scope: Forward-only schema migrations for long-lived databases while preserving the disposable replay/bootstrap path.  
Related docs: [infra/ci/ENVIRONMENT.md](../../infra/ci/ENVIRONMENT.md), [docs/ops/ci-workflow-hardening.md](./ci-workflow-hardening.md), [docs/architecture/decision-register.md](../architecture/decision-register.md)  
Last reviewed: 2026-03-21

## Split Contract

Two database paths now coexist intentionally:

- Disposable databases:
  - bootstrap from `schema/fodmap_fr_schema.sql`
  - destructive replay via `etl/phase2/scripts/phase2_replay_from_zero.sh`
  - Phase 3 local/CI seed via `etl/phase3/scripts/phase3_seed_for_api_ci.sh`
- Long-lived databases:
  - migrate forward with `dbmate`
  - migrations live under `schema/dbmate/migrations/`
  - generated schema dump lives at `schema/dbmate/schema.sql`

This branch does not replace replay/bootstrap. It adds the long-lived migration lane alongside it.

## Baseline Policy

- The first dbmate migration is a current-state baseline.
- It absorbs:
  - the full curated bootstrap from `schema/fodmap_fr_schema.sql`
  - the security schema from `schema/migrations/2026-02-25_security_consent_export_delete.sql`
  - the tracking schema from `schema/migrations/2026-03-20_symptoms_tracking_v1.sql`
  - the Clerk identity schema from `schema/migrations/2026-03-21_clerk_auth_identities.sql`
- Safe Harbor is already present in `schema/fodmap_fr_schema.sql` and is not repeated as a second dbmate migration.
- `schema/migrations/` remains legacy compatibility only for current tests/docs.
- New migrations go only under `schema/dbmate/migrations/`.

## Operator Commands

Use the repo commands below for long-lived environments:

```bash
pnpm db:wait
pnpm db:status
pnpm db:migrate
pnpm db:up
pnpm db:new -- add_example_change
```

Command contract:

- all commands route through `scripts/dbmate.sh`
- `API_DB_URL` is the target database DSN
- local disposable Postgres DSNs should include `?sslmode=disable`; hosted Neon DSNs keep the provider SSL requirement
- migration filenames must stay `YYYYMMDDHHMMSS_slug.sql`
- `schema/dbmate/schema.sql` is generated schema dump only, not the bootstrap source of truth

## Neon Operator Flow

1. Point `API_DB_URL` at the target Neon branch.
2. Run `pnpm db:migrate`.
3. Run `pnpm db:status` and confirm no pending migrations remain.
4. Proceed to hosted API or later ETL publish steps only after migration succeeds.

Never do this on a persistent Neon branch:

- run `etl/phase2/scripts/phase2_replay_from_zero.sh`
- run any command that drops and recreates the database
- treat `schema/migrations/` as the primary forward migration lane

## Ongoing Rule

Until the disposable replay/bootstrap path is replaced, every future schema change must update all three surfaces:

1. add a new dbmate migration under `schema/dbmate/migrations/`
2. update `schema/fodmap_fr_schema.sql`
3. regenerate `schema/dbmate/schema.sql`
