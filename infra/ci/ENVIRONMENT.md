# Environment Contract

This document defines environment variables used across the current Python/SQL stack and the near-term platform transition.

## Scope Rules

- Shared infrastructure variables belong in root `.env` (template: `.env.example`).
- Per-app runtime variables belong in app-local files (e.g. `apps/app/.env.local`) once those apps exist.
- CI workflows may still set variables explicitly in workflow YAML for reproducibility.

## Active Variables (Current Stack)

| Variable          | Used by                                                                                                                      | Required                      | Default/Example                       | Notes                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------- | --------------------------------------------------- |
| `API_DB_URL`      | `api/app/config.py`, `api/tests/conftest.py`, `.github/workflows/api.yml`                                                    | yes                           | `postgresql://.../fodmap_test`        | Primary FastAPI DB connection string.               |
| `API_NAME`        | `api/app/config.py`                                                                                                          | no                            | `fodmap-api`                          | Health metadata.                                    |
| `API_VERSION`     | `api/app/config.py`                                                                                                          | no                            | `v0`                                  | Health metadata.                                    |
| `ROOT_DIR`        | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `etl/phase3/scripts/phase3_seed_for_api_ci.sh`                              | no                            | auto-derived from script location     | Repo root override for script portability.          |
| `REPLAY_DB`       | `etl/phase2/scripts/phase2_replay_from_zero.sh`                                                                              | no                            | `fodmap_replay_test`                  | Replay database name.                               |
| `REPLAY_DB_URL`   | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml`                                                 | yes for non-default host/user | `postgresql://.../fodmap_replay_test` | Target DB URL for Phase2 replay.                    |
| `ADMIN_DB`        | `etl/phase2/scripts/phase2_replay_from_zero.sh`                                                                              | no                            | `template1`                           | Admin database name used for drop/create replay DB. |
| `ADMIN_DB_URL`    | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml`                                                 | yes for CI/remote             | `postgresql://.../template1`          | Admin connection for DB lifecycle operations.       |
| `PGHOST`          | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml`                                                 | no                            | `localhost`                           | Used to build default DB URLs.                      |
| `PGPORT`          | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml`                                                 | no                            | `5432`                                | Used to build default DB URLs.                      |
| `PGUSER`          | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml`                                                 | no                            | `$USER` or `postgres`                 | Used to build default DB URLs.                      |
| `PSQL_BIN`        | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `etl/phase3/scripts/phase3_seed_for_api_ci.sh`, `.github/workflows/api.yml` | no                            | `psql` / auto-detected                | Path to `psql` executable.                          |
| `CIQUAL_DATA_DIR` | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `etl/ciqual/fetch_ciqual_data.sh`                                           | no                            | script default path                   | Override location of CIQUAL files.                  |
| `CIQUAL_XLSX`     | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml`                                                 | no                            | exported by fetch script in CI        | CIQUAL XLSX override.                               |
| `CIQUAL_ALIM_XML` | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml`                                                 | no                            | exported by fetch script in CI        | CIQUAL `alim` XML override.                         |
| `CIQUAL_GRP_XML`  | `etl/phase2/scripts/phase2_replay_from_zero.sh`, `.github/workflows/api.yml`                                                 | no                            | exported by fetch script in CI        | CIQUAL `alim_grp` XML override.                     |
| `SEED_DB_URL`     | `etl/phase3/scripts/phase3_seed_for_api_ci.sh`, `.github/workflows/api.yml`                                                  | yes for non-arg usage         | `postgresql://.../fodmap_test`        | Phase3 seed DB connection string.                   |

## Reserved Near-Term Variables (Bootstrap Stubs Allowed)

These placeholders are for upcoming platform transition work. Frontend keys may be read by `apps/app` bootstrap stubs, but no production provider SDK wiring is enabled yet.

| Variable                              | Intended future owner   | Purpose                                                  |
| ------------------------------------- | ----------------------- | -------------------------------------------------------- |
| `NEON_API_KEY`                        | Infra/CI                | Neon API authentication.                                 |
| `NEON_PROJECT_ID`                     | Infra/CI                | Neon project target for branch workflow.                 |
| `NEON_BRANCH_PROD`                    | Infra/CI                | Production branch name (`main`).                         |
| `NEON_BRANCH_STAGING`                 | Infra/CI                | Persistent staging branch name (`staging`).              |
| `NEON_DATABASE_URL_PROD`              | Infra/CI                | Production database URL.                                 |
| `NEON_DATABASE_URL_STAGING`           | Infra/CI                | Staging database URL.                                    |
| `SENTRY_DSN_API`                      | API                     | API Sentry DSN.                                          |
| `SENTRY_DSN_APP`                      | Frontend                | App Sentry DSN.                                          |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`   | Frontend                | Clerk public key for browser runtime.                    |
| `CLERK_SECRET_KEY`                    | Frontend backend/server | Clerk secret key.                                        |
| `CLERK_JWT_ISSUER_DOMAIN`             | Frontend backend/server | Clerk issuer domain for JWT verification.                |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`        | Frontend                | Plausible site domain used by analytics bootstrap stubs. |
| `NEXT_PUBLIC_PLAUSIBLE_SRC`           | Frontend                | Plausible script URL override for bootstrap stubs.       |
| `NEXT_PUBLIC_AXEPTIO_CLIENT_ID`       | Frontend                | Axeptio client id used by consent bootstrap stubs.       |
| `NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION` | Frontend                | Axeptio cookie version used by consent bootstrap stubs.  |

## Operational Notes

- `.env.example` is a contract template and should remain credential-free.
- CI remains explicit via workflow `env` blocks; this file is documentation and local bootstrap aid.
- Any newly introduced runtime variable must be added to both `.env.example` and this document in the same PR.
