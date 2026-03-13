# FODMAP API (v0)

Status: Implemented
Audience: Contributor or engineer; Data or workflow operator
Scope: Setup, local execution, test flow, and OpenAPI contract entry point for the read-only API.
Related docs: [docs/foundation/project-definition.md](../docs/foundation/project-definition.md), [docs/foundation/documentation-personas.md](../docs/foundation/documentation-personas.md), [docs/README.md](../docs/README.md)
Last reviewed: 2026-03-08

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
`postgresql://postgres:postgres@localhost:5432/fodmap_api_ci`.

## OpenAPI

Canonical v0 review contract is committed at:

- `api/openapi/v0.yaml`

v0 is slug-based, returns both FR/EN fields, and has no locale negotiation.
Safe-Harbor V1 uses a dedicated endpoint (`GET /v0/safe-harbors`) so browse
discovery does not weaken the required `/v0/foods?q=...` search contract.
