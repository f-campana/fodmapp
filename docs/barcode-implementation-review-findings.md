# Barcode Implementation Review Findings

Date: 2026-02-24  
Branch: `codex/barcode-feature-v1`  
Scope: backend API, schema, shared packages, web manual input, native scanner package, Storybook coverage, and validation pipeline.

## Review Outcome

Status: not merge-ready yet.  
Main blockers are correctness/observability gaps in barcode lookup behavior.

## Findings

### 1) [P1] Heuristic resolution can remain resolved when current scoring no longer passes

- Area: lookup resolution logic
- Evidence:
  - `/Users/fabiencampana/Documents/Fodmap-barcode-v1/api/app/services/barcode_service.py:130`
  - `/Users/fabiencampana/Documents/Fodmap-barcode-v1/api/app/services/barcode_service.py:131`
- Issue:
  - If no candidate is currently accepted, existing heuristic link is reused, returning `resolved`.
  - This can bypass current threshold/margin gating and produce stale heuristic authority.
- Recommendation:
  - Enforce strict runtime gating: when current candidate set fails threshold/margin, return `unresolved`.
  - Keep manual links as authoritative.
  - Add integration test for "existing heuristic link + current low score => unresolved".

### 2) [P1] Provider error metadata is not persisted when serving stale cache fallback

- Area: cache observability and outage diagnostics
- Evidence:
  - `/Users/fabiencampana/Documents/Fodmap-barcode-v1/api/app/services/barcode_service.py:48`
  - `/Users/fabiencampana/Documents/Fodmap-barcode-v1/schema/fodmap_fr_schema.sql:557`
  - `/Users/fabiencampana/Documents/Fodmap-barcode-v1/schema/fodmap_fr_schema.sql:558`
- Issue:
  - On provider failure with stale fallback, response is served but cache row is not updated with `last_error_code` / `last_error_at`.
- Recommendation:
  - Persist error metadata on stale-fallback path while keeping stale payload unchanged.
  - Add test asserting error fields are updated during provider outage fallback.

### 3) [P2] Internal manual links can point to inactive foods

- Area: internal curation data integrity
- Evidence:
  - `/Users/fabiencampana/Documents/Fodmap-barcode-v1/api/app/sql.py:406`
  - `/Users/fabiencampana/Documents/Fodmap-barcode-v1/api/app/services/barcode_service.py:163`
- Issue:
  - Manual link lookup by slug does not constrain to `foods.status = 'active'`.
- Recommendation:
  - Restrict manual link targets to active foods.
  - Return `404` for inactive slugs in internal link endpoint.
  - Add integration test to prevent regressions.

### 4) [P2] Resolved lookup can expose links to inactive foods

- Area: public lookup consistency
- Evidence:
  - `/Users/fabiencampana/Documents/Fodmap-barcode-v1/api/app/sql.py:395`
- Issue:
  - `SQL_GET_BARCODE_LINK` joins foods without active-status filtering.
- Recommendation:
  - Filter link resolution join to active foods.
  - Define fallback behavior when an existing link points to inactive food (suggested: unresolved + candidates).

### 5) [P2] Heuristic audit events may be over-produced

- Area: audit/event quality and write pressure
- Evidence:
  - `/Users/fabiencampana/Documents/Fodmap-barcode-v1/api/app/services/barcode_service.py:104`
  - `/Users/fabiencampana/Documents/Fodmap-barcode-v1/api/app/services/barcode_service.py:117`
- Issue:
  - Current flow writes `set_heuristic` event each time a qualifying lookup occurs, even if link payload is unchanged.
- Recommendation:
  - Write heuristic event only on material change (`food_id`, `confidence`, `heuristic_version`, `signals_json`).
  - Keep reads idempotent under repeated scans/lookups.

### 6) [Resolved] OpenAPI-generated TypeScript parity restored

- Area: contract/typegen parity
- Evidence:
  - `pnpm openapi:check` passes.
  - `/Users/fabiencampana/Documents/Fodmap-barcode-v1/packages/types/src/generated/v0.ts` is in sync with the current spec.
- Resolution:
  - Regenerated and committed generated OpenAPI TypeScript output.
  - CI contract parity is now green for this finding.

### 7) [P3] Local integration coverage can be silently reduced by table-gated skips

- Area: confidence in integration path
- Evidence:
  - `/Users/fabiencampana/Documents/Fodmap-barcode-v1/api/tests/test_barcodes_integration.py:56`
  - `/Users/fabiencampana/Documents/Fodmap-barcode-v1/api/tests/test_barcodes_integration.py:57`
- Issue:
  - Barcode integration tests skip if schema objects are missing, which can hide regressions locally.
- Recommendation:
  - Keep skip behavior locally if needed, but enforce schema readiness in CI and fail if barcode tables are absent.
  - Add explicit CI precheck for barcode table presence.

### 8) [P3] Barcode client assumes JSON response bodies on all responses

- Area: client robustness
- Evidence:
  - `/Users/fabiencampana/Documents/Fodmap-barcode-v1/packages/barcode-client/src/index.ts:66`
- Issue:
  - Non-JSON error responses can throw parser exceptions outside typed `BarcodeClientError`.
- Recommendation:
  - Guard JSON parsing; fallback to generic structured error when body is not JSON.
  - Add tests for non-JSON/empty error responses.

## Validation Snapshot

### Passing

- `pnpm --filter @fodmap/barcode-core test`
- `pnpm --filter @fodmap/barcode-client test`
- `pnpm --filter @fodmap/barcode-web test`
- `pnpm --filter @fodmap/barcode-native test`
- `pnpm openapi:check`
- `python3 -m pytest -q api/tests` (26 passed, 3 skipped)
- `pnpm --filter @fodmap/storybook storybook:typecheck`
- `pnpm --filter @fodmap/storybook storybook:build`
- `pnpm --filter @fodmap/storybook storybook:test` (30 passed)
- `pnpm typecheck`
- `pnpm test`
- `./.github/scripts/quality-gate.sh`

## Suggested Resolution Order

1. Fix findings 1 and 2 first (behavior and observability correctness).
2. Fix findings 3, 4, 5 (data integrity and audit quality).
3. Fix findings 7, 8 (confidence and client resilience).

## Open Decision Required

- Should heuristic links be sticky by design, or should runtime threshold/margin always decide resolved vs unresolved?
  - Suggested default for v1: strict runtime gating, manual links only are persistent authority.
