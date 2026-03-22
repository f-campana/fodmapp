# API Koyeb + Neon Bootstrap

Status: Ready for operator execution
Audience: Maintainer or operator; Contributor or engineer
Scope: First hosted API environment on Koyeb with a Neon-backed Postgres connection.

Last reviewed: 2026-03-22

## Current decision

The first hosted API environment is planned to use:

- Koyeb for the FastAPI runtime
- Neon for PostgreSQL
- Vercel as the DNS authority

This remains intentionally a single hosted environment only:

- planned canonical origin: `https://api.fodmapp.fr`
- reserved future origin: `https://staging.api.fodmapp.fr`

Do not create a persistent staging API or staging Neon branch in this phase.

## Current platform state

The platform prerequisites that are now on `main` are:

- `dbmate` for long-lived schema migrations
- published `api_*_current` read models for Phase 3 serving
- `pnpm phase3:promote` for refresh-only persistent-db publish reruns
- `pnpm phase3:bootstrap` for first-time persistent data load on a schema-only database

What is still not done:

- the real Neon project is not created yet
- the real Koyeb service is not created yet
- `api.fodmapp.fr` is not live yet

Operational rule:

- keep destructive replay/seed scripts on disposable databases only
- do not point destructive replay scripts at a persistent Neon branch

## Planned Koyeb service settings

When the hosted API track is resumed, create one Koyeb app and one web service for the API with
these settings:

- app name: `fodmapp-api`
- service name: `api`
- deployment method: GitHub
- tracked branch: `main`
- auto-deploy on push: enabled
- builder: Dockerfile
- repository work directory: `api`
- Dockerfile path: `Dockerfile`
- region: `FRA` (Frankfurt)
- instance type: `free`
- public port: `8000`
- health check: HTTP `GET /v0/health`

Runtime values in Koyeb:

- secret: `API_DB_URL`
- env: `API_NAME=fodmapp-api`
- env: `API_VERSION=v0`

Git trigger behavior:

- Koyeb watches `main`
- repo root `.koyebignore` suppresses redeploys for docs and unrelated monorepo changes
- API code and API-local configuration remain deploy-relevant

## Planned Neon setup

When hosted activation resumes:

- create one Neon project
- use one canonical production branch only for the first hosted environment
- leave `staging` reserved for later
- use `pr-*` branches only for later validation if needed

Provider note:

- repo planning originally assumed a Neon `main` branch
- Neon docs now indicate that projects created after **April 18, 2025** may default to `production` and `development` instead of a single `main`
- for a brand-new Neon project created now, prefer the provider default production branch and record that choice in the operator guide rather than renaming repo contracts around a historical assumption

Before the API is exposed publicly, the hosted-activation track must run:

1. `pnpm db:migrate` on the target Neon branch
2. `pnpm phase3:bootstrap` on the schema-only database
3. `pnpm phase3:promote` for later refreshes on the already-loaded database

## Planned domain attachment

When the hosted activation track resumes:

1. attach `api.fodmapp.fr` to the Koyeb service
2. create the required DNS record in Vercel DNS
3. wait for Koyeb domain validation and TLS provisioning
4. confirm `https://api.fodmapp.fr/v0/health` returns `200`

Do not attach `staging.api.fodmapp.fr` in this phase.

## Validation checklist For Later Activation

Before calling the hosted environment ready in the later activation track:

1. Koyeb builds from `main` using `api/Dockerfile`.
2. The service becomes healthy on `/v0/health`.
3. `https://api.fodmapp.fr/v0/health` returns `200`.
4. `https://api.fodmapp.fr/v0/foods?q=a&limit=1` returns a valid response.
5. Docs-only commits do not trigger redeploys because of `.koyebignore`.
6. The target Neon database was first loaded through `pnpm phase3:bootstrap`, then refreshed through `pnpm phase3:promote`.

## Operator Guide

Use the detailed execution checklist in:

- `docs/ops/api-first-hosted-activation.md`
