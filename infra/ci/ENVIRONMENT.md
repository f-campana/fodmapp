# Environment Contract

This document defines environment variables used across the current Python/SQL stack and the near-term platform transition.

## Scope Rules

- Shared infrastructure variables belong in root `.env` (template: `.env.example`).
- Per-app runtime variables belong in app-local files (e.g. `apps/app/.env.local`) once those apps exist.
- CI workflows may still set variables explicitly in workflow YAML for reproducibility.

## Active Variables (Current Stack)

| Variable          | Used by                                                                                                                                                       | Required                      | Default/Example                       | Notes                                                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API_DB_URL`      | `api/app/config.py`, `api/tests/conftest.py`, `.github/workflows/api.yml`, `scripts/dbmate.sh`, `api/scripts/phase3_promote.py`, `package.json`               | yes                           | `postgresql://.../fodmap_test`        | Primary FastAPI DB connection string, dbmate target DSN, and persistent Phase 3 promote target. Local disposable Postgres URLs should set `sslmode=disable`; hosted Neon URLs keep provider SSL settings. |
| `API_NAME`        | `api/app/config.py`                                                                                                                                           | no                            | `fodmapp-api`                         | Health metadata.                                                                                                                                                                                          |
| `API_VERSION`     | `api/app/config.py`                                                                                                                                           | no                            | `v0`                                  | Health metadata.                                                                                                                                                                                          |
| `ROOT_DIR`        | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `etl/phase3/scripts/phase3_seed_for_api_ci.sh`                                                               | no                            | auto-derived from script location     | Repo root override for script portability.                                                                                                                                                                |
| `REPLAY_DB`       | `etl/phase2/scripts/phase2_replay_from_zero.sh`                                                                                                               | no                            | `fodmap_replay_test`                  | Replay database name.                                                                                                                                                                                     |
| `REPLAY_DB_URL`   | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml`                                                                                  | yes for non-default host/user | `postgresql://.../fodmap_replay_test` | Target DB URL for Phase2 replay.                                                                                                                                                                          |
| `ADMIN_DB`        | `etl/phase2/scripts/phase2_replay_from_zero.sh`                                                                                                               | no                            | `template1`                           | Admin database name used for drop/create replay DB.                                                                                                                                                       |
| `ADMIN_DB_URL`    | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml`                                                                                  | yes for CI/remote             | `postgresql://.../template1`          | Admin connection for DB lifecycle operations.                                                                                                                                                             |
| `PGHOST`          | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml`                                                                                  | no                            | `localhost`                           | Used to build default DB URLs.                                                                                                                                                                            |
| `PGPORT`          | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml`                                                                                  | no                            | `5432`                                | Used to build default DB URLs.                                                                                                                                                                            |
| `PGUSER`          | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml`                                                                                  | no                            | `$USER` or `postgres`                 | Used to build default DB URLs.                                                                                                                                                                            |
| `PSQL_BIN`        | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `etl/phase3/scripts/phase3_seed_for_api_ci.sh`, `api/scripts/phase3_promote.py`, `.github/workflows/api.yml` | no                            | `psql` / auto-detected                | Path to `psql` executable for replay, seeded Phase 3 CI, and manual Phase 3 promote runs.                                                                                                                 |
| `CIQUAL_DATA_DIR` | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `etl/ciqual/fetch_ciqual_data.sh`                                                                            | no                            | script default path                   | Override location of CIQUAL files.                                                                                                                                                                        |
| `CIQUAL_XLSX`     | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml`                                                                                  | no                            | exported by fetch script in CI        | CIQUAL XLSX override.                                                                                                                                                                                     |
| `CIQUAL_ALIM_XML` | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml`                                                                                  | no                            | exported by fetch script in CI        | CIQUAL `alim` XML override.                                                                                                                                                                               |
| `CIQUAL_GRP_XML`  | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml`                                                                                  | no                            | exported by fetch script in CI        | CIQUAL `alim_grp` XML override.                                                                                                                                                                           |
| `SEED_DB_URL`     | `etl/phase3/scripts/phase3_seed_for_api_ci.sh`, `.github/workflows/api.yml`                                                                                   | yes for non-arg usage         | `postgresql://.../fodmap_test`        | Phase3 seed DB connection string.                                                                                                                                                                         |

## CI Turborepo Cache Contract

Repository-level Turbo secrets are no longer part of the default CI contract for public cutover.

Current contract:

- `.github/workflows/ci.yml` runs in local-cache fallback mode by default (`.turbo` restore/save via `actions/cache/restore@v5` and `actions/cache/save@v5`).
- `.github/actions/setup-js-workspace` still supports remote cache if Turbo credentials are
  explicitly provided by a future approved policy.
- `.github/actions/setup-js-workspace` now uses Node 24-compatible JavaScript action runtimes for
  pnpm setup and Turbo local-cache restore on GitHub-hosted runners.
- `TURBO_TEAM` / `TURBO_TOKEN` are removed from repository secrets as of `2026-03-04`.

CI Turbo command policy:

- Turbo-eligible CI commands should use `pnpm exec turbo run ...` so workflows always resolve the pinned local Turbo version.
- Non-Turbo CI exceptions are intentional where Turbo caching does not apply, including:
  - `pnpm --filter @fodmapp/types openapi:check` for deterministic OpenAPI parity validation
  - Storybook Playwright browser install
  - Phase 2 reporting `render:*` commands

CI lint import preparation:

- `.github/workflows/ci.yml` `eslint` prebuilds workspace packages that expose runtime imports from `dist`
- current prebuild list:
  - `@fodmapp/ui`
  - `@fodmapp/reporting`
- this is a workflow contract, not an extra environment variable requirement; it keeps package-export import resolution stable on clean runners

Local full-gate lint preparation:

- `.github/scripts/quality-gate.sh --full` now applies the same `@fodmapp/ui` + `@fodmapp/reporting`
  prebuild contract before `pnpm lint:js:ci`
- dist-backed lint and artifact-producing local scopes are serialized after the read-only parallel pool
  to avoid shared-worktree races on generated outputs such as `packages/ui/dist`

## CI Governance Variables

These keys are optional and used by CI governance helper scripts.

| Variable                | Used by                                   | Required | Default/Example   | Notes                                                                                                                                                                            |
| ----------------------- | ----------------------------------------- | -------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CHANGESET_CHECK_DEBUG` | `.github/scripts/check-pr-changesets.mjs` | no       | `1`               | Enables verbose debug logs for diff refs, changed packages, workspace package inventory, changed changeset files, unknown changeset package names, and final gate decision path. |
| `PR_AUTHOR_LOGIN`       | `.github/scripts/check-pr-changesets.mjs` | no       | `dependabot[bot]` | Set by `changeset-pr-gate` workflow. Enables Dependabot dependency-only auto-exemption logic while keeping strict checks for human-authored PRs.                                 |

## API Workflow Runtime Guardrails

API workflow runtime guardrails are enforced in workflow config (not via environment variables):

- `.github/workflows/api.yml` sets job timeouts to bound runner/container stalls:
  - `api-tests`: `timeout-minutes: 15`
  - `dbmate-smoke`: `timeout-minutes: 15`
  - `api-integration-seeded`: `timeout-minutes: 25`
  - `api-gate`: `timeout-minutes: 5`
- if a timeout is reached, GitHub Actions fails the timed-out job and the required `API` gate fails via `api-gate`

## DBMate Migration Lane

`dbmate` is the forward-only schema migration lane for long-lived databases.

Contract:

- repo commands:
  - `pnpm db:wait`
  - `pnpm db:status`
  - `pnpm db:migrate`
  - `pnpm db:up`
  - `pnpm db:new -- <slug>`
- wrapper entrypoint:
  - `scripts/dbmate.sh`
- migration artifacts:
  - `schema/dbmate/migrations/`
  - `schema/dbmate/schema.sql`

Semantics:

- `API_DB_URL` is reused as the migration target DSN; no second runtime DSN is introduced.
- `.github/workflows/api.yml` pins `postgresql-client-16` in API jobs so the dump path stays on the Postgres 16 major version, while `scripts/dbmate.sh` normalizes client/server minor-version header noise before diff-checking `schema/dbmate/schema.sql`.
- local disposable Postgres URLs should explicitly set `sslmode=disable` so `dbmate` can connect to non-TLS local services; hosted Neon URLs keep the provider-managed SSL mode.
- `schema/dbmate/schema.sql` is generated schema dump only and is not the full bootstrap source of truth.
- `schema/fodmap_fr_schema.sql` remains the curated bootstrap for disposable replay/local CI databases.
- `schema/migrations/` is legacy compatibility only for current tests/docs and should not receive new migrations after dbmate bootstrap lands.
- destructive replay/seed scripts must never target a persistent Neon branch.
- `dbmate-smoke` now also asserts the publish-boundary schema objects (`publish_releases`, `published_food_rollups`, `api_publish_meta_current`) after a fresh migrate, so long-lived DB bootstrap covers the serving boundary as well as the base schema.

## Seeded API Publish Boundary

The seeded API workflow now exercises the publish boundary explicitly.

Contract:

- `.github/workflows/api.yml` and `.github/scripts/ci-api-pr.sh` run `etl/phase3/sql/phase3_publish_release_apply.sql` and `etl/phase3/sql/phase3_publish_release_checks.sql` after Phase 3 compute/activation and before API integration tests.
- the seeded API lane treats `api_publish_meta_current`, `api_food_rollups_current`, `api_food_subtypes_current`, and `api_swaps_current` as the runtime serving contract for rollups, subtypes, and swaps.
- no new environment variables are required for publish; CI reuses `API_DB_URL`.

Semantics:

- replay remains destructive/disposable-only and still seeds the compiler-owned latest Phase 3 views first.
- publish is a separate atomic step layered on top of Phase 3 compute; it must produce a current `api_v0_phase3` release before integration tests run.
- `/v0/health` can now surface publish freshness without changing the DB connection variable contract.

## Manual Phase 3 Promote Contract

Persistent-database refresh now reuses the existing DB/runtime environment variables.

Contract:

- `pnpm phase3:promote:check`, `pnpm phase3:promote`, and `pnpm phase3:promote:status` reuse `API_DB_URL`
- the runner uses `PSQL_BIN` for SQL execution and does not introduce a second DSN
- `phase3:promote:check` is expected to fail on a schema-only dbmate database, a bootstrap-only database, or any database that has never produced a current `api_v0_phase3` publish release, with the explicit bootstrap-out-of-scope message
- `phase3:promote` preserves activation-era `swap_rule_scores.scoring_version` values, reruns the conservative active-rule safety gate after score refresh, and executes publish apply/checks inside one publish transaction
- the disposable `phase3-promote-smoke` CI job stamps current dbmate migration versions onto the replay-seeded database before promote runs; this is test harness glue, not a hosted-environment operator step
- first persistent bootstrap is still a separate follow-up path; the manual promote runner is refresh-only

## CI Storybook Deploy Variables

These keys are required by `.github/workflows/storybook-deploy.yml` through the
`vercel-production` environment.

| Variable            | Used by                                  | Required | Default/Example   | Notes                                                                 |
| ------------------- | ---------------------------------------- | -------- | ----------------- | --------------------------------------------------------------------- |
| `VERCEL_TOKEN`      | `.github/workflows/storybook-deploy.yml` | yes      | Vercel CLI token  | Auth token for production `vercel pull` and `vercel deploy`.          |
| `VERCEL_ORG_ID`     | `.github/workflows/storybook-deploy.yml` | yes      | `team_...` / user | Vercel scope identifier used by CLI with linked project metadata.     |
| `VERCEL_PROJECT_ID` | `.github/workflows/storybook-deploy.yml` | yes      | `prj_...`         | Vercel project identifier for Storybook production deployment target. |

Storybook deploy security notes:

- Storybook deploy runs only on `push` to `main` (no PR preview lane).
- Secret access is gated by GitHub environment approval (`vercel-production`).
- Storybook access policy is managed in Vercel project settings:
  - Public

Cutover execution note (`2026-03-04`):

- `vercel-production` environment and approval gate are configured.
- Repository-level `VERCEL_*` secrets are still present during migration because secret values
  cannot be exported via GitHub API for automatic transfer.
- Finalization step: rotate `VERCEL_TOKEN`, set `VERCEL_*` as environment secrets, validate deploy,
  then delete repo-level `VERCEL_*`.

## App Runtime Integration Variables (`apps/app`)

These keys are now actively consumed by `apps/app` runtime adapters. All integrations are env-gated and default to safe no-op/disabled behavior when values are missing.

| Variable                                | Adapter                               | Required    | Behavior when missing                                                                                                                                |
| --------------------------------------- | ------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SENTRY_DSN_APP`                        | Sentry (`@sentry/nextjs`) server init | no          | Falls back to `NEXT_PUBLIC_SENTRY_DSN_APP`; disabled if both are empty.                                                                              |
| `NEXT_PUBLIC_SENTRY_DSN_APP`            | Sentry (`@sentry/nextjs`) client init | no          | Client instrumentation stays disabled.                                                                                                               |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`     | Clerk (`@clerk/nextjs`)               | conditional | Auth adapter stays `disabled` unless all Clerk keys are present.                                                                                     |
| `CLERK_SECRET_KEY`                      | Clerk (`@clerk/nextjs`)               | conditional | Auth adapter stays `disabled` unless publishable + secret key are both present.                                                                      |
| `CLERK_JWT_ISSUER_DOMAIN`               | Clerk (`@clerk/nextjs`)               | no          | Reserved for JWT issuer/domain checks in future auth hardening.                                                                                      |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`          | Plausible script + events             | no          | Analytics adapter stays `disabled`; no script injected.                                                                                              |
| `NEXT_PUBLIC_PLAUSIBLE_SRC`             | Plausible script + events             | no          | Defaults to `https://plausible.io/js/script.js`.                                                                                                     |
| `NEXT_PUBLIC_AXEPTIO_CLIENT_ID`         | Axeptio consent                       | no          | Consent adapter remains `deferred-noop` (runtime activation deferred).                                                                               |
| `NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION`   | Axeptio consent                       | no          | Consent adapter remains `deferred-noop` (runtime activation deferred).                                                                               |
| `NEXT_PUBLIC_ANALYTICS_CONSENT_GRANTED` | Consent fallback gate                 | no          | Defaults to `false`; can enable analytics runtime only in non-production validation. Production runtime ignores `true` until Axeptio activation.     |
| `NEXT_PUBLIC_API_BASE_URL`              | Public app reads + `/me/*` API access | no          | Public read client returns `api_not_configured`; consent bootstrap stays disabled until configured. Use the API origin; app clients normalize `/v0`. |

## Marketing App Variables (`apps/marketing`)

These keys are actively used by the marketing waitlist backend and landing feature flags.

| Variable                          | Adapter / Feature                     | Required    | Behavior when missing                                                                    |
| --------------------------------- | ------------------------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| `MARKETING_DB_URL`                | Waitlist backend (`app/api/waitlist`) | conditional | `POST /api/waitlist` returns `{ ok: false, code: \"server_error\" }` with HTTP 503.      |
| `RESEND_API_KEY`                  | Confirmation email provider           | no          | Signup succeeds and logs a warning; confirmation email is skipped.                       |
| `RESEND_FROM_EMAIL`               | Confirmation email sender             | no          | Defaults to `noreply@fodmapp.fr` when not set.                                           |
| `NEXT_PUBLIC_FF_SECTION_APPROACH` | Marketing feature flag                | no          | `"1"` shows the Approach section; any other value keeps it hidden (default V1 behavior). |
| `NEXT_PUBLIC_FF_SECTION_TRUST`    | Marketing feature flag                | no          | `"1"` shows the Trust section; any other value keeps it hidden (default V1 behavior).    |

## Reserved Near-Term Variables

| Variable                    | Intended future owner | Purpose                                          |
| --------------------------- | --------------------- | ------------------------------------------------ |
| `NEON_API_KEY`              | Infra/CI              | Neon API authentication.                         |
| `NEON_PROJECT_ID`           | Infra/CI              | Neon project target for branch workflow.         |
| `NEON_BRANCH_PROD`          | Infra/CI              | Production branch name (`main`).                 |
| `NEON_BRANCH_STAGING`       | Infra/CI              | Reserved future staging branch name (`staging`). |
| `NEON_DATABASE_URL_PROD`    | Infra/CI              | Production database URL.                         |
| `NEON_DATABASE_URL_STAGING` | Infra/CI              | Staging database URL.                            |
| `SENTRY_DSN_API`            | API                   | API Sentry DSN.                                  |

## Operational Notes

- `.env.example` is a contract template and should remain credential-free.
- Workflow-level secrets are usually passed through workflow inputs to `.github/actions/setup-js-workspace`,
  which handles cache mode selection and environment export for Turbo commands.
- CI remains explicit via workflow `env` blocks and/or action inputs; this file is documentation and local bootstrap aid.
- Disposable DBs still use monolithic bootstrap + replay/seed scripts; persistent DBs move through dbmate.
- Any newly introduced runtime variable must be added to both `.env.example` and this document in the same PR.
