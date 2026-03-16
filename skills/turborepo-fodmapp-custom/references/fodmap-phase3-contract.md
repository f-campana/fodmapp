# Fodmap Phase 3 Data Contract

Apply these rules when touching scoring, eligibility, swap batches, activation, or
`/v0/swaps`.

## Gate Flow (Required Order)

1. generation/rescore
2. human review CSV update
3. activation apply
4. post-activation checks

## Scoring and Eligibility Semantics

1. Unknown endpoint handling is strict:
   - If `from_level='unknown'` or `to_level='unknown'`, set
     `fodmap_safety_score=0.000`.
   - Unknown endpoint rows are never auto-eligible.
2. Conservative eligibility requires all:
   - Non-unknown endpoints
   - Non-worsening severity (`to <= from`)
   - Non-worsening burden (`to_burden_ratio <= from_burden_ratio`)
   - `fodmap_safety_score >= 0.500`

## Snapshot Lock Contract

Activation scripts must verify reviewed CSV snapshot fields against live DB values:

1. `scoring_version_snapshot`
2. `fodmap_safety_score_snapshot`

If snapshot mismatch is detected, fail fast and do not apply status changes.

## Bilingual Rule Content

1. `instruction_fr` is required.
2. `instruction_en` is required (or explicit deterministic fallback policy).

## Rank 2 Exclusion

Rank 2 is excluded from swap graph references until explicitly re-verified.

No rule may reference rank 2 as `from` or `to` in generation, apply, or activation.

## `/v0/swaps` API Contract

1. Return only `active` rules.
2. Deterministic sort order:
   - `fodmap_safety_score DESC`
   - `overall_score DESC`
   - `to_overall_level` severity ASC
     (`none`, `low`, `moderate`, `high`, `unknown`)
   - `coverage_ratio DESC`
   - `to_food_slug ASC`

## Additive-Only Batch Evolution

1. Extend Phase 3 via new scoped batch artifacts.
2. Do not destructively rewrite prior batch files/contracts.
3. New batch SQL/data must coexist with previous artifacts and remain idempotent.
