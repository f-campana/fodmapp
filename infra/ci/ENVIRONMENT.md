# Environment Contract

This document defines environment variables used across the current Python/SQL stack and the near-term platform transition.

## Scope Rules

- Shared infrastructure variables belong in root `.env` (template: `.env.example`).
- Per-app runtime variables belong in app-local files (e.g. `apps/app/.env.local`) once those apps exist.
- CI workflows may still set variables explicitly in workflow YAML for reproducibility.

## Active Variables (Current Stack)

| Variable | Used by | Required | Default/Example | Notes |
| --- | --- | --- | --- | --- |
| `API_DB_URL` | `api/app/config.py`, `api/tests/conftest.py`, `.github/workflows/api.yml` | yes | `postgresql://.../fodmap_test` | Primary FastAPI DB connection string. |
| `API_NAME` | `api/app/config.py` | no | `fodmap-api` | Health metadata. |
| `API_VERSION` | `api/app/config.py` | no | `v0` | Health metadata. |
| `BARCODE_FEATURE_ENABLED` | `api/app/config.py`, barcode public router | no | `false` | Feature flag for public barcode lookup endpoint. |
| `BARCODE_INTERNAL_ENABLED` | `api/app/config.py`, barcode internal auth/router | no | `false` | Feature flag for internal curation endpoints. |
| `BARCODE_ADMIN_TOKEN` | `api/app/config.py`, `api/app/auth.py` | yes for internal routes | empty | Static bearer token for `/v0/internal/barcodes/*`. |
| `OFF_API_BASE_URL` | `api/app/config.py`, `api/app/providers/open_food_facts.py` | no | `https://world.openfoodfacts.org` | Open Food Facts API base URL. |
| `OFF_USER_AGENT` | `api/app/config.py`, `api/app/providers/open_food_facts.py` | yes in production | `FODMAPPlatform/0.1 (contact@example.com)` | Required custom user-agent for OFF requests. |
| `OFF_TIMEOUT_SECONDS` | `api/app/config.py`, `api/app/providers/open_food_facts.py` | no | `3` | HTTP timeout for OFF requests. |
| `BARCODE_CACHE_TTL_HOURS` | `api/app/config.py`, barcode service | no | `168` | Cache TTL for OFF payloads. |
| `BARCODE_HEURISTIC_THRESHOLD` | `api/app/config.py`, barcode service | no | `0.75` | Minimum score to auto-persist heuristic link. |
| `BARCODE_HEURISTIC_MARGIN` | `api/app/config.py`, barcode service | no | `0.10` | Minimum gap to second candidate for auto-persist. |
| `ROOT_DIR` | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `etl/phase3/scripts/phase3_seed_for_api_ci.sh` | no | auto-derived from script location | Repo root override for script portability. |
| `REPLAY_DB` | `etl/phase2/scripts/phase2_replay_from_zero.sh` | no | `fodmap_replay_test` | Replay database name. |
| `REPLAY_DB_URL` | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml` | yes for non-default host/user | `postgresql://.../fodmap_replay_test` | Target DB URL for Phase2 replay. |
| `ADMIN_DB` | `etl/phase2/scripts/phase2_replay_from_zero.sh` | no | `template1` | Admin database name used for drop/create replay DB. |
| `ADMIN_DB_URL` | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml` | yes for CI/remote | `postgresql://.../template1` | Admin connection for DB lifecycle operations. |
| `PGHOST` | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml` | no | `localhost` | Used to build default DB URLs. |
| `PGPORT` | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml` | no | `5432` | Used to build default DB URLs. |
| `PGUSER` | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml` | no | `$USER` or `postgres` | Used to build default DB URLs. |
| `PSQL_BIN` | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `etl/phase3/scripts/phase3_seed_for_api_ci.sh`, `.github/workflows/api.yml` | no | `psql` / auto-detected | Path to `psql` executable. |
| `CIQUAL_DATA_DIR` | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `etl/ciqual/fetch_ciqual_data.sh` | no | script default path | Override location of CIQUAL files. |
| `CIQUAL_XLSX` | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml` | no | exported by fetch script in CI | CIQUAL XLSX override. |
| `CIQUAL_ALIM_XML` | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml` | no | exported by fetch script in CI | CIQUAL `alim` XML override. |
| `CIQUAL_GRP_XML` | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml` | no | exported by fetch script in CI | CIQUAL `alim_grp` XML override. |
| `SEED_DB_URL` | `etl/phase3/scripts/phase3_seed_for_api_ci.sh`, `.github/workflows/api.yml` | yes for non-arg usage | `postgresql://.../fodmap_test` | Phase3 seed DB connection string. |

## App Runtime Integration Variables (`apps/app`)

These keys are actively consumed by `apps/app` runtime adapters. Integrations are env-gated and default to safe no-op/disabled behavior when values are missing.

| Variable | Adapter | Required | Behavior when missing |
| --- | --- | --- | --- |
| `SENTRY_DSN_APP` | Sentry (`@sentry/nextjs`) server init | no | Falls back to `NEXT_PUBLIC_SENTRY_DSN_APP`; disabled if both are empty. |
| `NEXT_PUBLIC_SENTRY_DSN_APP` | Sentry (`@sentry/nextjs`) client init | no | Client instrumentation stays disabled. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk (`@clerk/nextjs`) | conditional | Auth adapter stays `disabled` unless required Clerk keys are present. |
| `CLERK_SECRET_KEY` | Clerk (`@clerk/nextjs`) | conditional | Auth adapter stays `disabled` unless publishable + secret key are both present. |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk (`@clerk/nextjs`) | no | Reserved for JWT issuer/domain checks in future auth hardening. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Plausible script + events | no | Analytics adapter stays `disabled`; no script injected. |
| `NEXT_PUBLIC_PLAUSIBLE_SRC` | Plausible script + events | no | Defaults to `https://plausible.io/js/script.js`. |
| `NEXT_PUBLIC_AXEPTIO_CLIENT_ID` | Axeptio consent | no | Consent adapter remains `deferred-noop` (runtime activation deferred). |
| `NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION` | Axeptio consent | no | Consent adapter remains `deferred-noop` (runtime activation deferred). |
| `NEXT_PUBLIC_ANALYTICS_CONSENT_GRANTED` | Consent fallback gate | no | Defaults to `false`; production runtime ignores `true` until Axeptio activation. |

## Reserved Near-Term Variables

| Variable | Intended future owner | Purpose |
| --- | --- | --- |
| `NEON_API_KEY` | Infra/CI | Neon API authentication. |
| `NEON_PROJECT_ID` | Infra/CI | Neon project target for branch workflow. |
| `NEON_BRANCH_PROD` | Infra/CI | Production branch name (`main`). |
| `NEON_BRANCH_STAGING` | Infra/CI | Persistent staging branch name (`staging`). |
| `NEON_DATABASE_URL_PROD` | Infra/CI | Production database URL. |
| `NEON_DATABASE_URL_STAGING` | Infra/CI | Staging database URL. |
| `SENTRY_DSN_API` | API | API Sentry DSN. |

## Operational Notes

- `.env.example` is a contract template and should remain credential-free.
- CI remains explicit via workflow `env` blocks; this file is documentation and local bootstrap aid.
- Any newly introduced runtime variable must be added to both `.env.example` and this document in the same PR.
