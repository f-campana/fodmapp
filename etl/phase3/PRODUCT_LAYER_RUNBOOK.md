# Phase 3 Product Layer Runbook (SQL MVP)

Status: Implemented
Audience: Data or workflow operator; Maintainer or operator; Reviewer or auditor
Scope: SQL-first execution, activation gates, API read-layer dependencies, and validation contracts for the Phase 3 product layer.
Related docs: [docs/foundation/project-definition.md](../../docs/foundation/project-definition.md), [docs/foundation/documentation-personas.md](../../docs/foundation/documentation-personas.md), [docs/architecture/boundaries-and-contracts.md](../../docs/architecture/boundaries-and-contracts.md)
Last reviewed: 2026-03-08

This runbook defines the SQL-first product-layer execution on top of completed Phase 2 data.

## Scope

Phase 3.0/3.1a/3.1b/3.2a/3.3/3.4/3.6/3.7 includes:

- culinary trait curation for priority ranks `1..42`
- full 6-subtype source-scoped rollups in `food_fodmap_rollups`
- latest rollup interfaces with coverage metadata
- initial 12 swap rules with contexts and scores
- 3.1b re-scoring and activation workflow (`draft` -> reviewed subset `active`)
- 3.3/3.4/3.7 systematic batch expansion workflows (`phase3_batch01_rule`, `phase3_batch02_rule`, `phase3_batch03_rule`)
- 3.6a/3.6b/3.6c research-led coverage uplift workflows
- Batch04 feasibility probe (non-mutating) for post-uplift candidate diagnostics
- 3.2a read-only FastAPI v0 endpoints using slug-based contracts

Out of scope:

- CI/bootstrap hosting
- rank 2 (garlic powder) rule activation before re-verification

## Preconditions

- Run against `fodmap_test` or an equivalent seeded database with completed Phase 2 prerequisites.
- Keep rank 2 excluded from generation, apply, activation, and API-facing swap flows.
- Treat review CSVs as gate inputs: Gate B cannot run until the relevant review file is updated by
  a human reviewer.
- Recompute rollups before any activation or API validation step that depends on refreshed
  measurements or thresholds.

## Current Canonical State (Post Batch C Closeout)

- Swap rules:
  - `phase3_mvp_rule`: 11 active / 1 draft
  - `phase3_batch01_rule`: 7 active / 32 draft
  - `phase3_batch02_rule`: 9 active / 31 draft
  - `phase3_batch03_rule`: 3 active / 11 draft
  - total: 30 active / 75 draft
- Deferred queue blocked on second reviewer:
  - 56 rows (issue #26)
- Coverage:
  - global `known_subtypes_count=1` bucket = 0
- Batch04 probe:
  - 10 candidates, 10 second-review required, 0 single-review eligible

## Artifacts

Data files:

- `etl/phase3/data/phase3_food_culinary_roles_v1.csv`
- `etl/phase3/data/phase3_food_flavor_profiles_v1.csv`
- `etl/phase3/data/phase3_food_texture_profiles_v1.csv`
- `etl/phase3/data/phase3_food_cooking_behaviors_v1.csv`
- `etl/phase3/data/phase3_food_cuisine_affinities_v1.csv`
- `etl/phase3/data/phase3_trait_exemptions_v1.csv`
- `etl/phase3/data/phase3_swap_rules_mvp_v1.csv`
- `etl/phase3/data/phase3_food_allergen_families_v1.csv`
- `etl/phase3/data/phase3_swap_rules_batch01_generated_v1.csv`
- `etl/phase3/data/phase3_swap_rules_batch02_generated_v1.csv`
- `etl/phase3/data/phase3_swap_rules_batch03_generated_v1.csv`
- `etl/phase3/data/phase3_coverage_batchA_measurements_v1.csv`
- `etl/phase3/data/phase3_coverage_batchB_measurements_v1.csv`
- `etl/phase3/data/phase3_coverage_batchC_measurements_v1.csv`
- `etl/phase3/data/phase3_rollup_default_thresholds_v1.csv`
- `etl/phase3/decisions/phase3_swap_activation_review_v1.csv`
- `etl/phase3/decisions/phase3_swap_batch01_review_v1.csv`
- `etl/phase3/decisions/phase3_swap_batch02_review_v1.csv`
- `etl/phase3/decisions/phase3_swap_batch03_review_v1.csv`

SQL files:

- `etl/phase3/sql/phase3_traits_apply.sql`
- `etl/phase3/sql/phase3_rollups_compute.sql`
- `etl/phase3/sql/phase3_swap_rules_apply.sql`
- `etl/phase3/sql/phase3_swap_rules_rescore.sql`
- `etl/phase3/sql/phase3_swap_activation_apply.sql`
- `etl/phase3/sql/phase3_swap_activation_checks.sql`
- `etl/phase3/sql/phase3_swap_rules_batch01_generate.sql`
- `etl/phase3/sql/phase3_swap_rules_batch01_apply.sql`
- `etl/phase3/sql/phase3_swap_rules_batch01_rescore.sql`
- `etl/phase3/sql/phase3_swap_rules_batch01_activation_apply.sql`
- `etl/phase3/sql/phase3_swap_rules_batch01_checks.sql`
- `etl/phase3/sql/phase3_swap_rules_batch02_generate.sql`
- `etl/phase3/sql/phase3_swap_rules_batch02_apply.sql`
- `etl/phase3/sql/phase3_swap_rules_batch02_rescore.sql`
- `etl/phase3/sql/phase3_swap_rules_batch02_activation_apply.sql`
- `etl/phase3/sql/phase3_swap_rules_batch02_checks.sql`
- `etl/phase3/sql/phase3_swap_rules_batch03_generate.sql`
- `etl/phase3/sql/phase3_swap_rules_batch03_apply.sql`
- `etl/phase3/sql/phase3_swap_rules_batch03_rescore.sql`
- `etl/phase3/sql/phase3_swap_rules_batch03_activation_apply.sql`
- `etl/phase3/sql/phase3_swap_rules_batch03_checks.sql`
- `etl/phase3/sql/phase3_coverage_batchA_apply.sql`
- `etl/phase3/sql/phase3_coverage_batchA_checks.sql`
- `etl/phase3/sql/phase3_coverage_batchB_apply.sql`
- `etl/phase3/sql/phase3_coverage_batchB_checks.sql`
- `etl/phase3/sql/phase3_coverage_batchC_apply.sql`
- `etl/phase3/sql/phase3_coverage_batchC_checks.sql`
- `etl/phase3/sql/phase3_swap_rules_batch04_feasibility_probe.sql`
- `etl/phase3/sql/phase3_mvp_checks.sql`
- `etl/phase3/sql/phase3_rollups_6subtype_checks.sql`
- `etl/phase3/scripts/phase3_swap_batch01_draft_instructions.py`

API files:

- `api/openapi/v0.yaml`
- `api/app/main.py`
- `api/app/routers/health.py`
- `api/app/routers/foods.py`
- `api/app/routers/swaps.py`

## Execution Order

Run against `fodmap_test` in this exact order:

1. `phase3_traits_apply.sql`
2. `phase3_rollups_compute.sql`
3. `phase3_rollups_6subtype_checks.sql`
4. `phase3_swap_rules_apply.sql`
5. `phase3_mvp_checks.sql`
6. `phase3_swap_rules_rescore.sql` (Gate A: recompute + export review CSV)
7. human review/update `phase3_swap_activation_review_v1.csv`
8. `phase3_swap_activation_apply.sql` (Gate B: apply reviewed activation decisions)
9. `phase3_swap_activation_checks.sql`

Idempotency pass (same order, second run):

1. `phase3_traits_apply.sql`
2. `phase3_rollups_compute.sql`
3. `phase3_rollups_6subtype_checks.sql`
4. `phase3_swap_rules_apply.sql`
5. `phase3_mvp_checks.sql`
6. `phase3_swap_rules_rescore.sql`
7. `phase3_swap_activation_apply.sql`
8. `phase3_swap_activation_checks.sql`

Terminology (Phase 3 swaps):

- `*_apply.sql` = materialize generated draft rules into DB scope (pre-review, no review decision application)
- `*_activation_apply.sql` = apply reviewed CSV decisions and change rule status (`approve -> active`, otherwise `draft`)

Batch01 execution (after MVP is stable):

1. `phase3_rollups_compute.sql`
2. `phase3_rollups_6subtype_checks.sql`
3. `phase3_swap_rules_batch01_generate.sql`
4. `phase3_swap_batch01_draft_instructions.py`
5. `phase3_swap_rules_batch01_apply.sql`
6. `phase3_swap_rules_batch01_rescore.sql`
7. human review/update `phase3_swap_batch01_review_v1.csv`
8. `phase3_swap_rules_batch01_activation_apply.sql`
9. `phase3_swap_rules_batch01_checks.sql`
10. rerun 8 and 9 for idempotency

## Validation

- Every execution lane must pass its paired checks after materialization and again after
  idempotency reruns where defined.
- Gate B activation steps must fail fast on snapshot-lock mismatches rather than mutating rule
  status.
- API freshness validation requires rerunning `phase3_rollups_compute.sql` and
  `phase3_rollups_6subtype_checks.sql` before serving updated rollup-dependent responses.

## MVP Locks

- ranks are resolved by `priority_rank -> phase2_priority_foods.resolved_food_id`
- source for curated product-layer data is `internal_rules_v1`
- trait exemption manifest exists but is empty (`0 rows`) for MVP
- 12 initial swap rules remain the MVP activation scope
- rank 2 is excluded from all swap rules
- batch01 generation is constrained to ranks `1..42` with rank2 exclusion
- batch01 selected count is bounded (`1..40`) with post-top40 anti-domination cap

## Rollup Semantics (3.1a Full Rollups)

Rollups evaluate all six subtypes (`fructan`, `gos`, `sorbitol`, `mannitol`, `fructose` excess, `lactose`) with worst-known severity semantics:

- coverage metrics are explicit: `known_subtypes_count`, `coverage_ratio`
- `none` is only allowed with full 6/6 coverage and all subtype levels `none`
- partial coverage + all-known-none is coerced to `unknown`
- explicit current subtype measurements have highest precedence for all six subtype codes
- fructose excess and CIQUAL lactose are fallback paths only when explicit subtype signals are absent
- sorbitol/mannitol may use CIQUAL total-polyols fallback only when explicit subtype signals are missing
- threshold precedence: food-specific first, then global defaults (`phase3_rollup_default_thresholds_v1.csv`)

Read interfaces:

- compiler-facing latest views:
  - `v_phase3_rollup_subtype_levels_latest`
  - `v_phase3_rollups_latest_full`
- API-facing published current views:
  - `api_food_subtypes_current`
  - `api_food_rollups_current`
  - `api_swaps_current`
- the publish-boundary dbmate migration backfills one `api_v0_phase3` release when it upgrades a long-lived DB that already has Phase 3 rollups and active swaps
- fresh databases stay unpublished until `etl/phase3/sql/phase3_publish_release_apply.sql` runs

Pipeline-managed snapshot artifacts:

- `phase3_subtype_levels_snapshot`
- `phase3_rollups_snapshot`
- both tables are rebuilt by `etl/phase3/sql/phase3_rollups_compute.sql`
- do not edit manually; treat as internal pipeline artifacts
- if upstream measurements/thresholds/nutrient links change, rerun rollup compute to avoid stale reads

Coverage baseline note:

- snapshot `1/6:21, 3/6:6, 4/6:10, 5/6:5` is a pre-3.1a baseline diagnostic
- unchanged inputs keep coverage distribution unchanged
- coverage increases only when new linked signals are added (new subtype measurements and/or nutrient linkage)
- baseline buckets are diagnostic only, not hard assertions

## 3.1b Swap Activation

3.1b is a two-gate process:

- Gate A (`phase3_swap_rules_rescore.sql`): recompute `fodmap_safety_score` for the 12 MVP rules from full rollups and export a review packet CSV.
- Gate B (`phase3_swap_activation_apply.sql`): apply human-reviewed `approve/reject` decisions and activate only eligible rules.

Scoring/eligibility specifics:

- unknown rollup endpoint (`from` or `to`) short-circuits recomputed `fodmap_safety_score` to `0.000`
- unknown endpoint rows are always `auto_eligible=false`
- conservative eligibility requires:
  - non-unknown endpoints
  - non-worsening overall severity (`to <= from`)
  - non-worsening burden ratio (`to_burden <= from_burden`)
  - recomputed score `>= 0.500`

CSV handoff contract:

- Gate A writes:
  `etl/phase3/decisions/phase3_swap_activation_review_v1.csv`
  via `\copy (SELECT ...) TO ... CSV HEADER`
- reviewer updates in place:
  - `review_decision` (`approve` or `reject`)
  - `review_notes`
  - `reviewed_by`
  - `reviewed_at`
- Gate B reads via `\copy ... FROM` and enforces snapshot lock against current score/version.

## 3.2a API Read Layer

v0 endpoints:

- `GET /v0/foods?q={text}&limit={1..50}`
- `GET /v0/health`
- `GET /v0/foods/{food_slug}`
- `GET /v0/foods/{food_slug}/rollup`
- `GET /v0/foods/{food_slug}/subtypes`
- `GET /v0/foods/{food_slug}/traits`
- `GET /v0/swaps?from={food_slug}&limit={int}&min_safety_score={0..1}`

v0 API contracts:

- public identity uses `food_slug` only
- responses return both FR/EN fields; no locale negotiation
- swaps return only `active` rules
- swap ordering is deterministic:
  - `fodmap_safety_score DESC`
  - `overall_score DESC`
  - `to_overall_level` severity ASC (`none`, `low`, `moderate`, `high`, `unknown`)
  - `coverage_ratio DESC`
  - `to_food_slug ASC`

Data freshness / dependency note:

- API rollup fields read from `api_food_rollups_current`
- publish still depends on pipeline-managed snapshots:
  - `phase3_subtype_levels_snapshot`
  - `phase3_rollups_snapshot`
- preflight before serving refreshed API data:
  - rerun `etl/phase3/sql/phase3_rollups_compute.sql`
  - rerun `etl/phase3/sql/phase3_rollups_6subtype_checks.sql`
  - rerun `etl/phase3/sql/phase3_publish_release_apply.sql`
  - rerun `etl/phase3/sql/phase3_publish_release_checks.sql`

Subtype endpoint payload contract:

- `subtype_code`, `subtype_level`
- `amount_g_per_serving`, `comparator`
- `low_max_g`, `moderate_max_g`
- `burden_ratio`
- signal/threshold provenance fields (`signal_source_kind`, `signal_source_slug`, `threshold_source_slug`)
- `is_default_threshold`, `is_polyol_proxy`
- `rollup_serving_g`, `computed_at`

## 3.3 Batch01 Systematic Expansion

Batch01 introduces systematic candidate generation over the locked 42-food universe:

- pair scope = ranks `1..42` excluding rank `2`
- conservative pre-filter:
  - endpoints known
  - non-worsening level
  - non-worsening burden
- ranking score:
  - `0.75 * fodmap_safety_score`
  - `0.15 * flavor_match_score`
  - `0.05 * texture_match_score`
  - `0.05 * method_match_score`

Selection policy:

- provisional global top 40
- post-selection per-source cap `<= 5`
- ranked waitlist backfill while preserving cap
- final selected count `1..40`

Review policy:

- strict two-tier gate (`second_review_required`) when:
  - `to_coverage_ratio < 0.50`, or
  - `fodmap_safety_score < 0.60`, or
  - cross-category substitution, or
  - allergen-family change
- approved rows flagged `second_review_required` must contain second-review metadata
- activation uses snapshot lock and conservative gate re-evaluation

## 3.4 Batch02 Systematic Expansion (Pre-Activation)

Batch02 extends systematic generation with an additional hard safety contract for direct swaps:

- `from_driver_subtype = to_driver_subtype` (no penalty fallback, hard exclusion)

Batch02 generation scope:

- candidate universe restricted to ranks `1..42`, excluding rank `2`
- pair exclusions applied before ranking:
  - exact open direct-swap pair already exists
  - reverse open direct-swap pair already exists
  - culinary compatibility gate (role overlap required + at least one sensory/behavior overlap)
- selection remains bounded `1..40` with post-top40 per-from and per-to caps (`<=5`) and deterministic backfill

Batch02 artifacts:

- generated CSV:
  - `etl/phase3/data/phase3_swap_rules_batch02_generated_v1.csv`
- review CSV:
  - `etl/phase3/decisions/phase3_swap_batch02_review_v1.csv`
- SQL flow:
  - `phase3_swap_rules_batch02_generate.sql`
  - `phase3_swap_rules_batch02_apply.sql`
  - `phase3_swap_rules_batch02_rescore.sql`
  - `phase3_swap_rules_batch02_activation_apply.sql` (deferred in this issue)
  - `phase3_swap_rules_batch02_checks.sql`

Audit columns exported for review and checks:

- `from_driver_subtype`
- `to_driver_subtype`

Execution stop gate for Phase 3.4:

- run generate -> draft apply -> rescore (Gate A review-packet prep)
- hand off the review packet for human decision updates
- run `*_activation_apply.sql` (Gate B) only after review updates are complete
- run checks after activation (or skip post-activation checks when activation is intentionally deferred)

## 3.7 Batch03 Direct-Swap Expansion (Single-Review Activation Path)

Batch03 extends the Batch02 contract with a new additive scope:

- `notes='phase3_batch03_rule'`
- `rule_key` prefix `B03_`
- `rule_kind='direct_swap'`

Locked generation gates:

- universe restricted to ranks `1..42`, excluding rank `2`
- conservative severity and burden gates:
  - `to_severity <= from_severity`
  - `to_burden_ratio <= from_burden_ratio`
- same-subtype hard gate:
  - `from_driver_subtype = to_driver_subtype`
- open direct-swap exclusions in both directions:
  - exact `(from,to)`
  - reverse `(to,from)`
- culinary compatibility:
  - role overlap required
  - and at least one of flavor/texture/method overlap > 0
- selection contract:
  - final size `1..40`
  - per-from cap `<=5`
  - per-to cap `<=5`
  - deterministic backfill

Batch03 artifacts:

- generated CSV:
  - `etl/phase3/data/phase3_swap_rules_batch03_generated_v1.csv`
- review CSV:
  - `etl/phase3/decisions/phase3_swap_batch03_review_v1.csv`
- SQL flow:
  - `phase3_swap_rules_batch03_generate.sql`
  - `phase3_swap_rules_batch03_apply.sql`
  - `phase3_swap_rules_batch03_rescore.sql`
  - `phase3_swap_rules_batch03_activation_apply.sql`
  - `phase3_swap_rules_batch03_checks.sql`

Review and activation contract:

- Gate A exports blank human decision metadata.
- Gate B enforces snapshot lock and conservative re-evaluation.
- Strict second-review policy remains:
  - rows requiring second review cannot be approved without second-review metadata
  - `second_reviewed_by` must differ from `reviewed_by`.
- status mapping:
  - `approve -> active`
  - `reject|defer -> draft`

## 3.6 Coverage Uplift Batch A (Research-First)

Scope lock (top-6 high-impact 1/6 foods by `to_candidate_frequency`):

- rank `18` `pois-chiche-appertise-egoutte`
- rank `21` `phase2-lentille-brune-cuite`
- rank `12` `phase2-farine-ble-t65`
- rank `38` `phase2-shiitake-cru`
- rank `7` `phase2-oignon-nouveau-bulbe-blanc`
- rank `11` `phase2-farine-ble-t55`

Artifacts:

- research matrix:
  - `etl/phase3/research/phase3_coverage_batchA_matrix_v1.csv`
- research report:
  - `etl/phase3/research/phase3_coverage_batchA_report_v1.md`
- curated ingestion input:
  - `etl/phase3/data/phase3_coverage_batchA_measurements_v1.csv`
- SQL flow:
  - `phase3_coverage_batchA_apply.sql`
  - `phase3_rollups_compute.sql`
  - `phase3_rollups_6subtype_checks.sql`
  - `phase3_coverage_batchA_checks.sql`

Execution notes:

- only rows with `measurement_found=true` are promoted into `food_fodmap_measurements`
- explicit measurement precedence remains enforced by `phase3_rollups_6subtype_checks.sql`
- allowed ingestion methods in Batch A:
  - `derived_from_nutrient` (exact CIQUAL nutrient derivation)
  - `expert_estimate` for plant-food lactose-zero inference rows
  - `derived_from_nutrient` for close cooked-variant CIQUAL polyol proxy rows (tracked by notes marker `coverage_batchA_v1:polyols_proxy_*`)
- blocked rows remain documented in the matrix with `blocked_reason`; unresolved cells are not auto-filled

## 3.6b Coverage Uplift Batch B (Research-First)

Scope lock (remaining high-impact `1/6` foods tied on `to_candidate_frequency=1`):

- rank `9` `phase2-echalote-bulbe-cru`
- rank `16` `phase2-artichaut-coeur`
- rank `24` `phase2-haricot-noir-cuit`
- rank `25` `pois-casse-bouilli-cuit-a-l-eau`
- rank `26` `phase2-edamame-cuit`
- rank `29` `phase2-pistache-crue`
- rank `32` `phase2-cerise-douce-crue`

Artifacts:

- research matrix:
  - `etl/phase3/research/phase3_coverage_batchB_matrix_v1.csv`
- research report:
  - `etl/phase3/research/phase3_coverage_batchB_report_v1.md`
- evidence ledger:
  - `etl/phase3/research/phase3_coverage_batchB_evidence_ledger_v1.csv`
- CIQUAL candidate log:
  - `etl/phase3/research/phase3_coverage_batchB_ciqual_candidates_v1.csv`
- curated ingestion input:
  - `etl/phase3/data/phase3_coverage_batchB_measurements_v1.csv`
- SQL flow:
  - `phase3_coverage_batchB_apply.sql`
  - `phase3_rollups_compute.sql`
  - `phase3_rollups_6subtype_checks.sql`
  - `phase3_coverage_batchB_checks.sql`

Locked Batch B research protocol:

1. plant lactose-zero inference first (`expert_estimate`, `inferred`, confidence `0.95`)
2. bibliography pass before blocking (`monash_app_v4_reference`, `muir_2007_fructan`, `biesiekierski_2011_fructan`, `yao_2005_polyols`, `dysseler_hoffem_gos`)
3. CIQUAL strict-match derivation:
   - excess fructose from `CIQUAL_32210`/`CIQUAL_32250`
   - conservative sorbitol/mannitol bounds from `CIQUAL_34000`
4. only then mark unresolved cells with `measurement_found=false` + explicit blocked taxonomy

Execution notes:

- only rows with `measurement_found=true` are ingested
- explicit precedence remains mandatory (`signal_source_kind='explicit_measurement'`)
- generic blocked reason `insufficient_variant_specific_evidence` is forbidden in Batch B R1
- blocked rows must use allowed taxonomy:
  - `no_literature_numeric_value`
  - `no_strict_ciqual_match`
  - `strict_match_rejected_prep_mismatch`
  - `insufficient_fructose_glucose_pair`
  - `evidence_conflict_not_promotable`
- batch checks enforce:
  - all 7 targets uplift to at least `2/6`
  - global `known_subtypes_count=1` bucket `<= 8`
  - no increase above low-coverage target baseline (`12`) in batch01+batch02 rules
  - non-lactose found floor `>= 6`
  - targeted proof: rank `9` and rank `32` each gain at least one non-lactose subtype

## 3.6c Coverage Uplift Batch C (Research-First, Early Human Gate)

Scope lock (the final 8 foods that were at `1/6` pre-Batch C):

- rank `3` `phase2-ail-infuse-huile`
- rank `6` `phase2-oignon-poudre`
- rank `8` `phase2-oignon-nouveau-tiges-vertes`
- rank `10` `phase2-poireau-partie-blanche-crue`
- rank `13` `phase2-farine-ble-t80`
- rank `17` `phase2-racine-chicoree`
- rank `27` `phase2-soja-graine-entiere-cuite`
- rank `28` `phase2-noix-cajou-crue`

Artifacts:

- research matrix:
  - `etl/phase3/research/phase3_coverage_batchC_matrix_v1.csv`
- research report:
  - `etl/phase3/research/phase3_coverage_batchC_report_v1.md`
- evidence ledger:
  - `etl/phase3/research/phase3_coverage_batchC_evidence_ledger_v1.csv`
- CIQUAL candidate log:
  - `etl/phase3/research/phase3_coverage_batchC_ciqual_candidates_v1.csv`
- curated ingestion input:
  - `etl/phase3/data/phase3_coverage_batchC_measurements_v1.csv`
- SQL flow:
  - `phase3_coverage_batchC_apply.sql`
  - `phase3_rollups_compute.sql`
  - `phase3_rollups_6subtype_checks.sql`
  - `phase3_coverage_batchC_checks.sql`
  - `phase3_swap_rules_batch04_feasibility_probe.sql` (non-mutating)

Locked Batch C research protocol:

1. Pass 1 lactose-zero inference for all 8 foods (`expert_estimate`, `inferred`, confidence `>=0.95`).
2. Pass 1b rank-3 special rule (`phase2-ail-infuse-huile`):
   - missing non-lactose subtypes must be inferred near-zero, not blocked.
   - notes marker: `coverage_batchC_v1:garlic_oil_fodmap_zero_inference`.
3. Pass 2 bibliography pass before blocking (`monash_app_v4_reference`, `muir_2007_fructan`, `biesiekierski_2011_fructan`, `yao_2005_polyols`, `dysseler_hoffem_gos`).
4. Pass 3 strict-match CIQUAL derivation only (identity + prep compatible).
5. Pass 4 blocked taxonomy only:
   - `no_literature_numeric_value`
   - `no_strict_ciqual_match`
   - `strict_match_rejected_prep_mismatch`
   - `insufficient_fructose_glucose_pair`
   - `evidence_conflict_not_promotable`
   - forbidden: `insufficient_variant_specific_evidence`

Mandatory stop gate (before ingestion):

- stop after research artifacts + measurements draft
- human checkpoint must confirm:
  - `non_lactose_found >= 12` (hard minimum)
  - target `non_lactose_found >= 15` (otherwise explicit justification required)
  - rank 3 has no blocked missing subtype rows
  - no generic blocked token
  - all blocked rows have traceable notes

Batch C SQL checks enforce post-ingestion:

- matrix count `40` (`8 x 5`)
- each target reaches `known_subtypes_count >= 2`
- global `known_subtypes_count=1` bucket must be `0`
- non-lactose found floor `>= 8`
- targeted proof: rank `10` and rank `13` each gain at least one non-lactose subtype
- rank `3` has zero blocked missing subtype rows
- low-coverage target rows across batch01+batch02+batch03 remain `<= 12`

## 3.6d Composition-Zero Batch01 (Research-First, Strict Gates)

Scope lock (current pilot-universe eligible cohort rows):

- rank `3` `phase2-ail-infuse-huile` (`cohort_oil_fat`)

Observed pilot-universe cohort availability:

- `cohort_oil_fat`: in-scope (`rank=3`)
- `cohort_plain_protein`: no eligible rows in current 42-food universe

Artifacts:

- research matrix:
  - `etl/phase3/research/phase3_composition_zero_batch01_matrix_v1.csv`
- research report:
  - `etl/phase3/research/phase3_composition_zero_batch01_report_v1.md`
- evidence ledger:
  - `etl/phase3/research/phase3_composition_zero_batch01_evidence_ledger_v1.csv`
- curated ingestion input:
  - `etl/phase3/data/phase3_composition_zero_batch01_measurements_v1.csv`
- SQL flow:
  - `phase3_composition_zero_batch01_apply.sql`
  - `phase3_rollups_compute.sql`
  - `phase3_rollups_6subtype_checks.sql`
  - `phase3_composition_zero_batch01_checks.sql`

Locked Batch01 promotion contract:

1. one approved food scope row (`rank=3`) expanded to all six subtype rows
2. six required subtype rows:
   - `fructan`, `fructose`, `gos`, `lactose`, `mannitol`, `sorbitol`
3. per-row value contract:
   - `amount_raw='0'`
   - `comparator='eq'`
   - `amount_g_per_100g=0`
   - `amount_g_per_serving=0`
4. method/source/evidence contract:
   - `method='expert_estimate'`
   - `source_slug='internal_rules_v1'`
   - `evidence_tier='inferred'`
   - `confidence_score=0.950` (oil cohort in Batch01)
5. notes marker contract:
   - `composition_zero_batch01_v1:cohort_oil_fat;gate:single_ingredient=1;gate:processing_risk=0`

Blocked taxonomy contract (when blocked rows are present):

- allowed:
  - `not_single_ingredient_food`
  - `processing_risk_additives`
  - `missing_official_support`
  - `evidence_conflict_not_promotable`
  - `unknown_identity_or_prep`
- forbidden:
  - `insufficient_variant_specific_evidence`

Execution notes:

- only rows with `measurement_found=true` are ingested
- additive-only scope: Batch01 deletes/replaces only prior rows tagged `composition_zero_batch01_v1:%`
- rank `2` exclusion remains mandatory
- explicit precedence remains mandatory (`signal_source_kind='explicit_measurement'`)

Human stop gate (mandatory before apply):

- review matrix/report/ledger/measurements draft as a single packet
- confirm Batch01 intentionally includes only the oil cohort in current pilot scope
- confirm source policy:
  - official sources for promotable rows
  - secondary sources narrative-only in report/ledger

## 3.2b.1 CI Seeded Integration Pipeline

CI integration tests now execute against a fully seeded DB profile (`fodmapp_api_ci`) in this order:

1. Fetch pinned CIQUAL files with checksum verification:
   - `etl/ciqual/fetch_ciqual_data.sh`
2. Phase 2 from-zero replay:
   - `etl/phase2/scripts/phase2_replay_from_zero.sh`
3. Phase 3 seed for API integration:
   - `etl/phase3/scripts/phase3_seed_for_api_ci.sh`
4. API integration tests:
   - `pytest -m integration api/tests`

Path contract:

- Phase 2/3 SQL `\copy` file inputs are repo-relative (`etl/...`).
- Replay/seed scripts resolve `ROOT_DIR` from script location and execute from repo root.
- CI no longer requires a user-home symlink shim for seeded integration runs.
- Known limitation: `phase3_seed_for_api_ci.sh` seeds through MVP activation (`phase3_swap_activation_*`) only; Batch01/Batch02 activation state is intentionally not replayed in CI seeded profile.

## Rollback Strategy

If needed, remove source-scoped Phase 3 artifacts and rerun:

- traits: delete rows for priority food IDs from food trait junction tables
- rollups: delete `food_fodmap_rollups` rows where `source_id=internal_rules_v1`
- swaps: delete `swap_rule_scores`, `swap_rule_contexts`, then `swap_rules` where `notes='phase3_mvp_rule'` and source `internal_rules_v1`

Then rerun the standard execution order.
