# Products Guided Discovery V1

Status: Planned
Audience: Product or design collaborator; Contributor or engineer; Reviewer or auditor
Scope: Backend-only `/v0/products` guided discovery lane for packaged products.
Related docs: [docs/architecture/boundaries-and-contracts.md](../architecture/boundaries-and-contracts.md), [docs/research/safe-harbor-mode-framing-2026-03-13.md](../research/safe-harbor-mode-framing-2026-03-13.md), [docs/foundation/project-definition.md](../foundation/project-definition.md)
Last reviewed: 2026-03-21

## Summary

Products Guided Discovery V1 adds a separate packaged-product lane beside the canonical
food lane. It supports barcode lookup, product detail, parsed ingredients, and a
guided heuristic assessment built from Open Food Facts plus canonical food matches.

This lane is intentionally lower-contract-strength than canonical `foods`, `swaps`,
and `safe-harbors`.

## Locked Decisions

1. Canonical and guided contracts remain separate.
2. Open Food Facts is the only provider in V1.
3. Public product endpoints are read-first and may enqueue bounded refresh requests,
   but they must not fetch provider data inline.
4. Numeric gram guidance is allowed only for a dominant matched canonical food:
   high confidence, one dominant substantive ingredient or explicit share >= 80%,
   and non-unknown canonical rollup/threshold basis.
5. No V1 changes to `/v0/foods`, `/v0/swaps`, or `/v0/safe-harbors`.
6. No frontend or mobile consumers are part of this work.

## Public Contract

The V1 product lane exposes:

1. `GET /v0/products/barcodes/{code}`
2. `GET /v0/products/{product_id}`
3. `GET /v0/products/{product_id}/ingredients`
4. `GET /v0/products/{product_id}/assessment`

All responses must identify the contract tier as `guided` and expose freshness,
confidence, and caveat fields when applicable.

## Non-Goals

1. Replacing or weakening the canonical food ETL and Phase 3 serving contracts.
2. Exposing product assessments through canonical food endpoints.
3. Inline provider fetches or inline heuristic computation on public GET routes.
4. Shipping barcode UX, scan UI, or mobile integration in this implementation lane.
