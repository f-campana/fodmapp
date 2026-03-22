# First Hosted API Activation

Status: Ready for operator execution
Audience: Maintainer or operator
Scope: First live Koyeb + Neon activation for `https://api.fodmapp.fr`.

Last reviewed: 2026-03-22

## Purpose

This runbook covers the first real hosted activation of the API after the platform hardening work that
landed on `main`:

- `dbmate` for long-lived schema migration
- published `api_*_current` views for serving rollups, subtypes, and swaps
- `pnpm phase3:bootstrap` for first-time persistent data load
- `pnpm phase3:promote` for later non-destructive refresh/publish reruns
- `api/Dockerfile` and `.koyebignore` for the planned Koyeb runtime

This runbook does **not** create a staging environment. It activates one production-like environment only.

## Provider Notes

Koyeb:

- the free instance is limited to one service per organization and currently provides `512MB` RAM, `0.1 vCPU`, and `2GB` SSD
- free instances are limited to `Frankfurt` or `Washington, D.C.`
- Koyeb custom domains use a three-step flow: assign the domain to the app, create the DNS record, then validate TLS
- HTTP health checks should use `GET /v0/health` and require a `2xx` or `3xx` response

Neon:

- connection strings use standard Postgres format and include `sslmode=require`
- current Neon docs indicate that projects created after **April 18, 2025** may default to `production` and `development` branches instead of a single `main`

Repo-specific inference:

- because `API_DB_URL` is reused by `dbmate`, `phase3:bootstrap`, `phase3:promote`, and the API runtime, start with the **direct** Neon connection string for first activation
- if runtime pooling becomes necessary later, split operator/runtime DSNs in a separate change instead of improvising during first activation

## Provider References

- [Koyeb deploy with GitHub](https://www.koyeb.com/docs/build-and-deploy/deploy-with-git)
- [Koyeb custom domains](https://www.koyeb.com/docs/run-and-scale/domains)
- [Koyeb health checks](https://www.koyeb.com/docs/run-and-scale/health-checks)
- [Koyeb instances](https://www.koyeb.com/docs/reference/instances)
- [Neon branching](https://neon.com/docs/introduction/branching)
- [Neon connection strings](https://neon.com/docs/connect/connect-from-any-app)

## Preconditions

Before starting:

1. `main` is clean and current.
2. The operator can sign into Neon, Koyeb, and Vercel.
3. CIQUAL source files are available locally or can be fetched into the repo defaults.
4. `uv`, `pnpm`, `psql`, and Docker are available locally.
5. The repo root `.env` or shell exports can provide `API_DB_URL`, `API_NAME`, and `API_VERSION`.

## Activation Sequence

### 1. Create the Neon project

In Neon:

1. Create one project in a region close to the Koyeb service.
2. If Neon presents `production` and `development` by default, use `production` as the first live branch.
3. Use the default database unless you have an approved reason to rename it.
4. Copy the **direct** Postgres connection string from the Connect modal.

Local export:

```bash
export API_DB_URL='postgresql://<role>:<password>@<host>/<db>?sslmode=require&channel_binding=require'
export API_NAME='fodmapp-api'
export API_VERSION='v0'
```

### 2. Apply long-lived schema migrations

From the repo root:

```bash
pnpm db:migrate
pnpm db:status
```

Success criteria:

- `dbmate` completes without error
- `Pending: 0` is reported
- the target database is schema-complete and still data-empty

### 3. Run the first persistent data load

First verify the target is eligible for bootstrap:

```bash
pnpm phase3:bootstrap:check
```

Then run the first load:

```bash
pnpm phase3:bootstrap -- --manifest-out ./.activation/bootstrap-manifest.json
```

Success criteria:

- the command exits `0`
- no database drop/recreate occurs
- no tracked review CSVs are edited
- the manifest contains a current `publish_id`

Expected counts after bootstrap:

- `42` resolved Phase 2 priority rows
- `42` published rollups
- `252` published subtype rows
- `11` published active swaps
- `11` active MVP rules
- `1` draft MVP rule

### 4. Verify steady-state handoff

Before exposing the API, prove the later refresh path works:

```bash
pnpm phase3:promote:check
pnpm phase3:promote -- --manifest-out ./.activation/promote-manifest.json
```

Success criteria:

- `phase3:promote:check` exits `0`
- `phase3:promote` exits `0`
- a new `publish_id` is created
- published counts remain stable

### 5. Create the Koyeb service

In Koyeb:

1. Create one app named `fodmapp-api`.
2. Create one web service named `api`.
3. Deployment method: GitHub.
4. Tracked branch: `main`.
5. Builder: Dockerfile.
6. Work directory: `api`.
7. Dockerfile location: `Dockerfile`.
8. Region: `FRA` (Frankfurt).
9. Instance type: free.
10. Public port: `8000`.

Runtime values:

- secret: `API_DB_URL`
- env: `API_NAME=fodmapp-api`
- env: `API_VERSION=v0`

Health check:

- protocol: HTTP
- method: `GET`
- path: `/v0/health`

### 6. Wait for the generated Koyeb URL to go healthy

Before custom domain work:

1. wait for the deployment to become healthy
2. open the Koyeb-generated `*.koyeb.app` URL
3. confirm:
   - `/v0/health` returns `200`
   - `/v0/foods?q=a&limit=1` returns a valid response
   - `/v0/swaps?food_slug=...` returns active swaps only for a known seeded food

Do not attach the custom domain until the generated Koyeb URL is healthy.

### 7. Attach `api.fodmapp.fr`

In Koyeb:

1. add the custom domain `api.fodmapp.fr` to the app
2. note the DNS record Koyeb asks you to create

In Vercel DNS:

1. create the DNS record exactly as Koyeb specifies
2. wait for domain validation and TLS provisioning to complete in Koyeb

Success criteria:

- `https://api.fodmapp.fr/v0/health` returns `200`
- TLS is valid

### 8. Cut over the frontend

Only after the API domain is healthy:

1. set `NEXT_PUBLIC_API_BASE_URL=https://api.fodmapp.fr` in the app runtime
2. deploy the frontend runtime with that absolute origin
3. verify at least one user-facing read path end to end

## Smoke Checklist

Run these checks after the domain is attached:

```bash
curl -fsS https://api.fodmapp.fr/v0/health | jq
curl -fsS 'https://api.fodmapp.fr/v0/foods?q=a&limit=1' | jq
```

Recommended SQL verification before cutover:

```sql
select release_kind, publish_id, published_at
from api_publish_meta_current;

select count(*) from api_food_rollups_current;
select count(*) from api_food_subtypes_current;
select count(*) from api_swaps_current;
select status, count(*) from swap_rules group by status order by status;
```

Expected first-load shape:

- `api_food_rollups_current`: `42`
- `api_food_subtypes_current`: `252`
- `api_swaps_current`: `11`
- `swap_rules`: `11 active`, `1 draft`

## Rollback Guidance

If Koyeb deploys but the app is unhealthy:

1. do not change DNS yet
2. inspect Koyeb deployment logs and health-check settings
3. confirm `API_DB_URL` points at the intended Neon branch and database

If the API domain is unhealthy after DNS cutover:

1. pause frontend cutover
2. inspect Koyeb instance health and logs
3. if needed, remove or disable the custom domain until the generated `*.koyeb.app` URL is healthy again

If data shape is wrong after bootstrap:

1. do not expose the API publicly
2. inspect `.activation/bootstrap-manifest.json`
3. compare row counts against the expected `42 / 252 / 11 / 11 / 1` contract
4. if the branch is still intended to be disposable, reset it in Neon or recreate the project instead of improvising a partial repair path

## Out of Scope

- staging API activation
- shared staging/prod Neon hierarchy
- split runtime/operator DB URLs
- scheduled promote runs
- automated Koyeb or Neon provisioning
