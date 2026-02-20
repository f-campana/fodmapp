# Phase 3.6 Coverage Uplift Batch A (Top-6 Targets)

## Scope
Target foods prioritized by `to_candidate_frequency` from batch01+batch02 generated pools:

1. rank 18 `pois-chiche-appertise-egoutte`
2. rank 21 `phase2-lentille-brune-cuite`
3. rank 12 `phase2-farine-ble-t65`
4. rank 38 `phase2-shiitake-cru`
5. rank 7 `phase2-oignon-nouveau-bulbe-blanc`
6. rank 11 `phase2-farine-ble-t55`

Each food was audited across missing subtype cells (5 per food, 30 total).

## Method
1. Baseline missing-subtype inventory extracted from `v_phase3_rollup_subtype_levels_latest`.
2. Source pass performed against ANSES CIQUAL 2025 public table (English workbook, 2025-11-03).
3. Evidence handling followed Phase-2 discipline:
   - subtype measurements only ingested when source linkage was explicit and sufficiently specific;
   - low-specificity proxies were documented as blocked;
   - confidence scores assigned in the `0.60-0.70` band for secondary database evidence.

## Outcomes
- Missing subtype cells reviewed: **30**
- `measurement_found=true`: **7**
- `measurement_found=false` (blocked): **23**

Found rows are concentrated on exact CIQUAL matches for wheat flour T55/T65:
- rank 11: lactose, sorbitol, mannitol
- rank 12: fructose (excess upper bound), lactose, sorbitol, mannitol

Blocked rows are retained for:
- chickpea canned drained (code 20532 has missing sugar/polyol cells),
- brown lentil cooked (variant-specific evidence gap),
- spring onion white bulb raw (exact variant gap),
- shiitake raw (exact variant gap),
- remaining flour subtypes lacking robust subtype-specific evidence.

## Deliverables
1. Research matrix: `etl/phase3/research/phase3_coverage_batchA_matrix_v1.csv`
2. Curated ingestion input: `etl/phase3/data/phase3_coverage_batchA_measurements_v1.csv`
3. Apply/check SQL:
   - `etl/phase3/sql/phase3_coverage_batchA_apply.sql`
   - `etl/phase3/sql/phase3_coverage_batchA_checks.sql`
