# Barcode Feature V1 Manual Testing

This runbook captures the manual/local verification steps for the Barcode Feature V1 implementation.

## 1. Install Dependencies

```bash
# from repository root on branch codex/barcode-feature-v1
pnpm install
python3 -m pip install -e './api[dev]'
```

## 2. Check Barcode Tables in Local DB

```bash
API_DB_URL=postgresql://$USER@localhost:5432/fodmap_test
psql "$API_DB_URL" -c "select to_regclass('public.barcode_cache_entries') as cache, to_regclass('public.barcode_food_links') as links, to_regclass('public.barcode_food_link_events') as events;"
```

Expected: all three columns are non-null.

If any are `null`, local DB schema is behind the branch and must be rebuilt/reseeded before full manual validation.

## 3. Start API with Barcode Flags Enabled

```bash
cd api
API_DB_URL=postgresql://$USER@localhost:5432/fodmap_test \
BARCODE_FEATURE_ENABLED=true \
BARCODE_INTERNAL_ENABLED=true \
BARCODE_ADMIN_TOKEN=test-secret \
uvicorn app.main:app --reload --port 8000
```

## 4. Public Endpoint Smoke Tests

```bash
curl -s http://127.0.0.1:8000/v0/barcodes/036000291452 | jq
curl -s http://127.0.0.1:8000/v0/barcodes/abc123 | jq
```

Expected:
- valid code returns `200` with lookup payload.
- invalid code returns `422` with `validation_error`.

## 5. Internal Manual Link Curation Flow

Set manual link:

```bash
curl -s -X PUT 'http://127.0.0.1:8000/v0/internal/barcodes/036000291452/link' \
  -H 'Authorization: Bearer test-secret' \
  -H 'X-Actor: fabien' \
  -H 'Content-Type: application/json' \
  -d '{"food_slug":"riz_blanche_cuit"}' | jq
```

Verify public lookup reflects manual link:

```bash
curl -s http://127.0.0.1:8000/v0/barcodes/036000291452 | jq
```

Clear manual link:

```bash
curl -s -X DELETE 'http://127.0.0.1:8000/v0/internal/barcodes/036000291452/link' \
  -H 'Authorization: Bearer test-secret' \
  -H 'X-Actor: fabien' | jq
```

## 6. Automated Test Commands

From repository root:

```bash
./.github/scripts/quality-gate.sh
pnpm openapi:check
pnpm typecheck
pnpm test
python3 -m pytest -m "not integration" api/tests
API_DB_URL=postgresql://$USER@localhost:5432/fodmap_test python3 -m pytest -m integration api/tests
```

If `pnpm openapi:check` fails locally, regenerate then re-check:

```bash
pnpm openapi:generate
pnpm openapi:check
```

Optional per-package checks:

```bash
pnpm --filter @fodmap/barcode-core test
pnpm --filter @fodmap/barcode-client test
pnpm --filter @fodmap/barcode-web test
pnpm --filter @fodmap/barcode-native test
```

## 7. Storybook Manual Verification

Run Storybook locally:

```bash
pnpm --filter @fodmap/storybook storybook
```

Validate Storybook build/typecheck:

```bash
pnpm --filter @fodmap/storybook storybook:typecheck
pnpm --filter @fodmap/storybook storybook:build
```

Optional Storybook interaction runner:

```bash
pnpm --filter @fodmap/storybook storybook:test
```

Manual checklist:
- `Features/Barcode/Manual Input` stories render in Storybook navigation.
- Play interactions pass for all barcode manual-input scenarios.
- Normalized outputs shown in the panel match expected codes.
- Dark mode scenario preserves validation behavior semantics.
- Input accessible name matches the visible label (`Enter barcode` by default).
- Invalid scenarios toggle `aria-invalid` and expose an error alert (`role="alert"`).
- Input references the error node via `aria-errormessage` when invalid.
- Input and submit controls are at least 44px tall in this component variant.
