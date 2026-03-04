# Phase 3.6d Composition-Zero Batch01 (Research-First, R1)

## Scope

Batch01 applies the composition-zero lane to the current Phase 3 pilot universe (`phase2_priority_foods`, rank `1..42`, rank `2` excluded).

Locked cohort policy:

1. `cohort_oil_fat`
2. `cohort_plain_protein`

Observed cohort availability in the current 42-food universe:

1. `cohort_oil_fat`: rank `3` (`phase2-ail-infuse-huile`)
2. `cohort_plain_protein`: no eligible rows in current scope

## Source policy (tiered)

Promotable evidence uses official sources only.

1. Monash FODMAP explainer: https://www.monashfodmap.com/blog/fodmap/
2. Monash proteins guidance: https://www.monashfodmap.com/blog/navigating-proteins-on-the-low-fodmap-diet/
3. Monash high/low foods page: https://www.monashfodmap.com/about-fodmap-and-ibs/high-and-low-fodmap-foods/
4. Monash not-listed caution: https://www.monashfodmap.com/blog/does-food-not-listed-in-app-mean-you-can-eat-it/

Secondary explanatory references are recorded for narrative context only and are not used as promotable measurement evidence.

1. FODMAP Everyday lab-testing context: https://www.fodmapeveryday.com/monash-university-low-fodmap-lab-testing-explained/
2. Clinical review context: https://pmc.ncbi.nlm.nih.gov/articles/PMC7690730/

## Claim map

1. C01: FODMAPs are fermentable short-chain carbohydrates (supports composition-zero principle).
2. C02: Plain fats/oils and plain animal proteins are typically low/no FODMAP by composition.
3. C03: Processing/additives can invalidate composition assumptions.
4. C04: Food not listed in app is not automatic proof of low/high FODMAP.
5. C05: Lab outcomes/serving framing can vary over time (context only).
6. C06: Clinical background supports conservative interpretation (context only).

## Candidate gating contract used

1. Universe: current Phase 3 pilot foods only.
2. Rank 2 exclusion: enforced.
3. Token-based additive/processing exclusion uses the locked screen:
   - `marin`, `mariné`, `sauce`, `pané`, `assais`, `season`, `charcut`, `sausage`, `saucisse`, `bacon`, `jambon`, `ham`, `fum`, `smoke`, `prepared`, `nugget`, `burger`
4. Ambiguous identity/preparation defaults to blocked.

## Batch01 outcome

1. Matrix rows: `6`
2. `measurement_found=true`: `6`
3. `measurement_found=false`: `0`
4. Promoted food scope:
   - rank `3`, `phase2-ail-infuse-huile`, six subtype zero rows
5. Plain-protein cohort in current universe:
   - `0` promotable rows (no eligible Phase 3 pilot candidates)

## Human checkpoint request

Before running apply SQL, review the following together:

1. `etl/phase3/research/phase3_composition_zero_batch01_report_v1.md`
2. `etl/phase3/research/phase3_composition_zero_batch01_evidence_ledger_v1.csv`
3. `etl/phase3/research/phase3_composition_zero_batch01_matrix_v1.csv`
4. `etl/phase3/data/phase3_composition_zero_batch01_measurements_v1.csv`

Gate condition:

1. Confirm that Batch01 intentionally includes only oil cohort rows due current pilot-universe composition.
2. Confirm additive-only intent and no activation-scope change.
