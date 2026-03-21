# FODMAP API (v0)

Status: Implemented
Audience: Contributor or engineer; Data or workflow operator
Scope: Setup, local execution, test flow, and OpenAPI contract entry point for the read-only API.
Related docs: [docs/foundation/project-definition.md](../docs/foundation/project-definition.md), [docs/foundation/documentation-personas.md](../docs/foundation/documentation-personas.md), [docs/README.md](../docs/README.md)
Last reviewed: 2026-03-21

Read-only FastAPI service exposing Phase 3 product-layer data:

- food metadata by `food_slug`
- Safe-Harbor V1 cohort discovery derived from CIQUAL + internal rules
- latest full rollup projection
- curated culinary traits
- active swap recommendations

## Local setup

```bash
cd api
uv sync --extra dev
```

Operator scripts that load or refresh persistent data also need the bootstrap extra:

```bash
cd api
uv sync --extra dev --extra bootstrap
```

## Run

```bash
API_DB_URL="postgresql://$USER@localhost:5432/fodmap_test" \
uv run uvicorn app.main:app --reload --port 8000
```

## Tests

Contract/unit tests:

```bash
cd api
uv run pytest -m "not integration"
```

Integration tests (requires seeded `fodmap_test`):

```bash
cd api
API_DB_URL="postgresql://$USER@localhost:5432/fodmap_test" uv run pytest -m integration
```

## CI integration profile

GitHub Actions now runs integration tests against a fully seeded Postgres database:

1. Phase 2 full replay (`etl/phase2/scripts/phase2_replay_from_zero.sh`)
2. Phase 3 product-layer seed (`etl/phase3/scripts/phase3_seed_for_api_ci.sh`)
3. API integration tests (`pytest -m integration api/tests`)

CIQUAL inputs are downloaded from official public endpoints and validated by SHA-256 via:

- `etl/ciqual/fetch_ciqual_data.sh`

If checksums drift, CI fails fast before seeding.

Local CI parity command from repository root:

```bash
./.github/scripts/ci-api-pr.sh
```

Defaults assume local Postgres is available at
`postgresql://postgres:postgres@localhost:5432/fodmapp_api_ci`.

## OpenAPI

Canonical v0 review contract is committed at:

- `api/openapi/v0.yaml`

v0 is slug-based, returns both FR/EN fields, and has no locale negotiation.
Safe-Harbor V1 uses a dedicated endpoint (`GET /v0/safe-harbors`) so browse
discovery does not weaken the required `/v0/foods?q=...` search contract. The
endpoint only returns foods backed by explicit Safe-Harbor V1 `6/6` zero packs
materialized from CIQUAL-linked foods and internal rules.

Rollup, subtype, and swap serving now go through the Phase 3 publish boundary:

- Phase 3 compute still rebuilds internal snapshot artifacts.
- `etl/phase3/sql/phase3_publish_release_apply.sql` copies the current compiler outputs into immutable `publish_id` tables and flips the `api_*_current` views atomically.
- API reads use the published current views rather than the compiler-owned `v_phase3_*_latest*` views directly.
- The publish-boundary dbmate migration backfills one `api_v0_phase3` release when an upgraded database already has Phase 3 rollups and active swaps. Fresh databases stay unpublished until the explicit publish step runs.

## Planned Hosted Runtime

The first hosted API target is planned as:

- Koyeb for the FastAPI runtime
- Neon for PostgreSQL
- `https://api.fodmapp.fr` as the canonical hosted origin

The hosted API is not live from this branch. First hosted activation now depends on this operator sequence:

1. `pnpm db:migrate`
2. `pnpm phase3:bootstrap`
3. later refreshes via `pnpm phase3:promote`
4. only then attach `https://api.fodmapp.fr`

Hosted activation remains a later operator track until this bootstrap branch lands on `main`.

Container bootstrap artifacts for that later hosting track are now committed:

- `api/Dockerfile`
- `api/.dockerignore`
- `docs/ops/api-koyeb-neon-bootstrap.md`

The runtime remains read-only and stateless. `API_DB_URL`, `API_NAME`, and `API_VERSION` are the
planned Koyeb runtime values once the hosted track resumes.
