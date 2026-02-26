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
2. Source pass executed in two layers:
   - CIQUAL 2025 public table (English workbook, 2025-11-03), including close cooked-variant rows where exact rows were missing.
   - Existing Phase 2 bibliography anchors (`monash_app_v4_reference`, `muir_2007_fructan`, `biesiekierski_2011_fructan`, `yao_2005_polyols`) for variant-specific availability checks.
3. Evidence handling followed Phase-2 discipline:
   - exact nutrient derivations kept as `derived_from_nutrient`;
   - plant-only lactose inference promoted with `expert_estimate` method, `inferred` tier, and explicit notes marker `coverage_batchA_v1:plant_lactose_zero_inference`;
   - cooked-variant polyol proxies for chickpea/lentil promoted conservatively with `derived_from_nutrient` method, `<` bounds, `inferred` tier, and notes marker `coverage_batchA_v1:polyols_proxy_*`;
   - unresolved cells remain blocked with explicit `blocked_reason`.

## Outcomes

- Missing subtype cells reviewed: **30**
- `measurement_found=true`: **15**
- `measurement_found=false` (blocked): **15**

Newly promoted rows in second pass:

- plant lactose-zero inference rows for ranks 7/18/21/38
- proxy total-polyol derived sorbitol/mannitol rows for:
  - rank 18 from CIQUAL `20507` (boiled chickpea proxy)
  - rank 21 from CIQUAL `20360` (cooked lentil average proxy)

Exact CIQUAL rows retained from first pass:

- rank 11: lactose, sorbitol, mannitol
- rank 12: fructose (excess upper bound), lactose, sorbitol, mannitol

Still blocked after second pass:

- rank 18: fructan, fructose
- rank 21: fructan, fructose
- rank 38: fructan, fructose, gos, sorbitol
- rank 7: fructose, gos, sorbitol, mannitol
- rank 11: fructose, gos
- rank 12: gos

## Deliverables

1. Research matrix: `etl/phase3/research/phase3_coverage_batchA_matrix_v1.csv`
2. Curated ingestion input: `etl/phase3/data/phase3_coverage_batchA_measurements_v1.csv`
3. Apply/check SQL:
   - `etl/phase3/sql/phase3_coverage_batchA_apply.sql`
   - `etl/phase3/sql/phase3_coverage_batchA_checks.sql`
