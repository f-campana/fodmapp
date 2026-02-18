# FODMAP API (v0)

Read-only FastAPI service exposing Phase 3 product-layer data:

- food metadata by `food_slug`
- latest full rollup projection
- curated culinary traits
- active swap recommendations

## Local setup

```bash
cd /Users/fabiencampana/Documents/Fodmap/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
```

## Run

```bash
API_DB_URL="postgresql://$USER@localhost:5432/fodmap_test" \
uvicorn app.main:app --reload --port 8000
```

## Tests

Contract/unit tests:

```bash
cd /Users/fabiencampana/Documents/Fodmap/api
pytest -m "not integration"
```

Integration tests (requires seeded `fodmap_test`):

```bash
cd /Users/fabiencampana/Documents/Fodmap/api
API_DB_URL="postgresql://$USER@localhost:5432/fodmap_test" pytest -m integration
```

## OpenAPI

Canonical v0 review contract is committed at:

- `/Users/fabiencampana/Documents/Fodmap/api/openapi/v0.yaml`

v0 is slug-based, returns both FR/EN fields, and has no locale negotiation.
