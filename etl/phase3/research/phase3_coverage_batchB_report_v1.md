# Phase 3.6b Coverage Uplift Batch B (Research-First, R1 fix-forward)

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
- Cells with no promotable numeric evidence were blocked with specific taxonomy reasons (no generic placeholder reasons).

3. **Pass 3: strict-match CIQUAL evaluation**
- Strict-match policy enforced (ingredient identity + preparation class compatibility).
- Promoted strict candidates:
  - rank 9 from CIQUAL `20097` (raw shallot)
  - rank 16 from CIQUAL `20155` (artichoke heart, canned/drained)
  - rank 32 from CIQUAL `13008` (raw sweet cherry)
- Rejected candidates logged where prep mismatch or evidence conflict prevented promotion.

4. **Pass 4: explicit blocked outcomes**
- Remaining unresolved cells recorded with allowed blocked taxonomy and source-check trace notes.

## Outcomes
- Matrix rows: **35**
- `measurement_found=true`: **15**
- `measurement_found=false`: **20**
- non-lactose found rows: **8** (passes floor `>=6`)

## Expected coverage impact (post-ingest)
| Rank | Food | Before | After | Uplift source |
|---|---|---:|---:|---|
| 9 | phase2-echalote-bulbe-cru | 1/6 | 5/6 | CIQUAL strict-match + lactose inference |
| 16 | phase2-artichaut-coeur | 1/6 | 5/6 | CIQUAL strict-match + lactose inference |
| 24 | phase2-haricot-noir-cuit | 1/6 | 2/6 | lactose inference |
| 25 | pois-casse-bouilli-cuit-a-l-eau | 1/6 | 2/6 | lactose inference |
| 26 | phase2-edamame-cuit | 1/6 | 2/6 | lactose inference |
| 29 | phase2-pistache-crue | 1/6 | 2/6 | lactose inference |
| 32 | phase2-cerise-douce-crue | 1/6 | 4/6 | CIQUAL strict-match + lactose inference |

## New audit trail artifacts
1. `etl/phase3/research/phase3_coverage_batchB_evidence_ledger_v1.csv`
2. `etl/phase3/research/phase3_coverage_batchB_ciqual_candidates_v1.csv`

## Deliverables
1. `etl/phase3/research/phase3_coverage_batchB_matrix_v1.csv`
2. `etl/phase3/data/phase3_coverage_batchB_measurements_v1.csv`
3. `etl/phase3/sql/phase3_coverage_batchB_apply.sql`
4. `etl/phase3/sql/phase3_coverage_batchB_checks.sql`
