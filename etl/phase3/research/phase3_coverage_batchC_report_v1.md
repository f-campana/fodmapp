# Phase 3.6c Coverage Uplift Batch C (Research-First, R1)

## Scope
Targets are the 8 remaining foods at `known_subtypes_count=1`:

1. rank 3 `phase2-ail-infuse-huile`
2. rank 6 `phase2-oignon-poudre`
3. rank 8 `phase2-oignon-nouveau-tiges-vertes`
4. rank 10 `phase2-poireau-partie-blanche-crue`
5. rank 13 `phase2-farine-ble-t80`
6. rank 17 `phase2-racine-chicoree`
7. rank 27 `phase2-soja-graine-entiere-cuite`
8. rank 28 `phase2-noix-cajou-crue`

Cells audited: **40** missing subtype cells (`8 foods x 5 missing subtypes`).

## Locked 4-pass protocol applied
1. Pass 1 lactose-zero inference for all 8 foods.
2. Pass 1b garlic-infused-oil special-case (rank 3): non-lactose rows forced to near-zero found values, not blocked.
3. Pass 2 bibliography sweep before blocking (`monash_app_v4_reference`, `muir_2007_fructan`, `biesiekierski_2011_fructan`, `yao_2005_polyols`, `dysseler_hoffem_gos`).
4. Pass 3 strict-match CIQUAL derivation attempted for all targets; one accepted strict-match for T80 flour.
5. Pass 4 explicit blocked taxonomy only.

## Outcomes
- Matrix rows: **40**
- `measurement_found=true`: **30**
- `measurement_found=false`: **10**
- Non-lactose found rows: **22**

Checkpoint thresholds:
- hard minimum `non_lactose_found >= 12`: **PASS**
- target `non_lactose_found >= 15`: **PASS**
- rank 3 blocked non-lactose rows: **0**
- forbidden blocked token `insufficient_variant_specific_evidence`: **0 rows**

## Expected coverage impact (pre-ingest estimate)
| Rank | Food | Before | After (expected) | Notes |
|---|---|---:|---:|---|
| 3 | garlic-infused oil | 1/6 | 5/6 | Pass1b special-case near-zero non-lactose + lactose zero |
| 6 | onion powder | 1/6 | 4/6 | fructose + polyol bounds + lactose zero |
| 8 | spring onion green tops | 1/6 | 4/6 | fructose + polyol bounds + lactose zero |
| 10 | leek white raw | 1/6 | 4/6 | fructose + polyol bounds + lactose zero |
| 13 | wheat flour T80 | 1/6 | 4/6 | CIQUAL strict-match + lactose/polyol additions |
| 17 | chicory root | 1/6 | 2/6 | lactose zero + conservative fructose |
| 27 | whole cooked soybean | 1/6 | 4/6 | fructose + polyol bounds + lactose zero |
| 28 | raw cashew | 1/6 | 3/6 | fructose + sorbitol bounds + lactose zero |

## Blocked rows (taxonomy)
- `no_literature_numeric_value`: 10
- `no_strict_ciqual_match`: 0
- `strict_match_rejected_prep_mismatch`: 0
- `insufficient_fructose_glucose_pair`: 0
- `evidence_conflict_not_promotable`: 0

## Artifacts
1. `etl/phase3/research/phase3_coverage_batchC_matrix_v1.csv`
2. `etl/phase3/research/phase3_coverage_batchC_evidence_ledger_v1.csv`
3. `etl/phase3/research/phase3_coverage_batchC_ciqual_candidates_v1.csv`
4. `etl/phase3/data/phase3_coverage_batchC_measurements_v1.csv`

## Human Checkpoint Request (mandatory stop)
Please review matrix/report quality before ingestion. Ingestion SQL is prepared but intentionally not executed in this step.
