# Phase 3.6b Coverage Uplift Batch B (Research-First)

## Scope
Target foods: remaining high-impact `1/6` foods tied on `to_candidate_frequency=1` in batch01+batch02 generated pools.

1. rank 9 `phase2-echalote-bulbe-cru`
2. rank 16 `phase2-artichaut-coeur`
3. rank 24 `phase2-haricot-noir-cuit`
4. rank 25 `pois-casse-bouilli-cuit-a-l-eau`
5. rank 26 `phase2-edamame-cuit`
6. rank 29 `phase2-pistache-crue`
7. rank 32 `phase2-cerise-douce-crue`

Cells audited: 35 missing subtype cells (7 foods x 5 missing subtypes).

## Locked 4-pass protocol applied
1. **Pass 1: plant lactose-zero inference**
- Applied to all 7 targets.
- Contract: `lactose=0`, `eq`, `expert_estimate`, `inferred`, confidence `0.950`, source `internal_rules_v1`.

2. **Pass 2: bibliography scan before blocking**
- Reviewed against:
  - `monash_app_v4_reference`
  - `muir_2007_fructan`
  - `biesiekierski_2011_fructan`
  - `yao_2005_polyols`
  - `dysseler_hoffem_gos`
- No additional subtype-composition rows were identified that could be promoted for the remaining missing cells without overreaching variant specificity.

3. **Pass 3: CIQUAL cooked-variant proxy evaluation for polyols**
- Evaluated CIQUAL analogue path for conservative polyol split (`CIQUAL_34000` with `lt/lte/eq`).
- No robust analogue rows were promoted in Batch B due to variant-distance and nutrient-availability constraints for this target set.

4. **Pass 4: explicit blocked outcomes**
- All remaining cells recorded with `measurement_found=false` and specific `blocked_reason` + notes.

## Outcomes
- Matrix rows: **35**
- `measurement_found=true`: **7**
- `measurement_found=false`: **28**

## Expected coverage impact (post-ingest)
| Rank | Food | Before | After | Uplift source |
|---|---|---:|---:|---|
| 9 | phase2-echalote-bulbe-cru | 1/6 | 2/6 | lactose zero inference |
| 16 | phase2-artichaut-coeur | 1/6 | 2/6 | lactose zero inference |
| 24 | phase2-haricot-noir-cuit | 1/6 | 2/6 | lactose zero inference |
| 25 | pois-casse-bouilli-cuit-a-l-eau | 1/6 | 2/6 | lactose zero inference |
| 26 | phase2-edamame-cuit | 1/6 | 2/6 | lactose zero inference |
| 29 | phase2-pistache-crue | 1/6 | 2/6 | lactose zero inference |
| 32 | phase2-cerise-douce-crue | 1/6 | 2/6 | lactose zero inference |

## Deliverables
1. `etl/phase3/research/phase3_coverage_batchB_matrix_v1.csv`
2. `etl/phase3/data/phase3_coverage_batchB_measurements_v1.csv`
3. `etl/phase3/sql/phase3_coverage_batchB_apply.sql`
4. `etl/phase3/sql/phase3_coverage_batchB_checks.sql`
