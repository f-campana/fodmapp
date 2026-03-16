# Local App Validation

Status: Implemented
Audience: Contributor or engineer; Product or design collaborator
Scope: Local installation, API startup, frontend startup, and manual validation for the first live web product slice.
Related docs: [`apps/app/README.md`](../../apps/app/README.md), [`api/README.md`](../../api/README.md), [`infra/ci/ENVIRONMENT.md`](../../infra/ci/ENVIRONMENT.md)
Last reviewed: 2026-03-16

Use this runbook to validate the live app slice locally against a real seeded API.

## Prerequisites

1. Node.js `>=22`
2. `pnpm` `10.x`
3. `uv`
4. Local Postgres
5. Repo cloned at `/Users/fabiencampana/Documents/fodmapp`

## Install

From repo root:

```bash
pnpm install --frozen-lockfile
```

From the API directory:

```bash
cd api
uv sync --extra dev
```

## Database Setup

The app expects the local API to read from `fodmap_test`.

If the database does not exist yet:

```bash
createdb fodmap_test
```

If the database is missing data or needs a clean replay:

From repo root:

```bash
REPLAY_DB=fodmap_test \
REPLAY_DB_URL="postgresql://$USER@localhost:5432/fodmap_test" \
ADMIN_DB_URL="postgresql://$USER@localhost:5432/postgres" \
PGUSER="$USER" \
uv run --project api bash etl/phase2/scripts/phase2_replay_from_zero.sh
```

Then seed the Phase 3 product layer:

```bash
SEED_DB_URL="postgresql://$USER@localhost:5432/fodmap_test" \
uv run --project api bash etl/phase3/scripts/phase3_seed_for_api_ci.sh
```

## Start the API

From `/Users/fabiencampana/Documents/fodmapp/api`:

```bash
API_DB_URL="postgresql://$USER@localhost:5432/fodmap_test" \
uv run uvicorn app.main:app --reload --port 8000
```

Quick checks:

```bash
curl http://127.0.0.1:8000/v0/health
curl "http://127.0.0.1:8000/v0/foods?q=ail"
curl "http://127.0.0.1:8000/v0/safe-harbors"
```

## App Environment

Create or update:

- `apps/app/.env.local`

Add:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Important:

- Use the API origin only, not `/v0`.
- The value must be an absolute URL because server-rendered app routes cannot resolve a relative API base.

## Start the Frontend

From repo root:

```bash
pnpm --filter @fodmapp/app dev
```

The app will be available at:

- [http://localhost:3000](http://localhost:3000)

## Manual Validation Checklist

### Home

1. Open `/`
2. Confirm links to `/aliments` and `/decouvrir`

### Search

Validate:

- `/aliments`
- `/aliments?q=ail`
- `/aliments?q=oignon`
- `/aliments?q=lentille`
- `/aliments?q=zzzz`

Check:

1. Query state is reflected in the URL
2. Search results render cleanly
3. No-match state is understandable
4. Foods with incomplete rollups are visibly incomplete, not broken

### Food Detail

Open at least:

1. One food detail page with swaps
2. One food detail page with zero swaps

Check:

1. Swap cards render score bars and trust chips
2. Zero-swap state links to `/decouvrir`
3. Rollup-unavailable state renders as handled degraded UI

### Safe Harbor

Open:

- `/decouvrir`

Check:

1. Cohorts render when returned by the API
2. `caveat_fr` appears per cohort
3. Attribution and no-endorsement text are visible
4. Empty or degraded states remain understandable if no cohorts are returned

### Failure Handling

Stop the API and reload:

- `/aliments?q=ail`
- `/decouvrir`

Confirm the app renders handled failure states rather than crashing.

## Minimum Success Bar

1. API health responds successfully
2. Food search returns real results from `/v0/foods`
3. At least one detail page loads successfully
4. `/decouvrir` renders a coherent live state
5. No route crashes when the API is unavailable
