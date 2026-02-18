# Phase 3 Product Layer Runbook (SQL MVP)

This runbook defines the SQL-first product-layer execution on top of completed Phase 2 data.

## Scope

Phase 3.0/3.1a/3.1b/3.2a includes:
- culinary trait curation for priority ranks `1..42`
- full 6-subtype source-scoped rollups in `food_fodmap_rollups`
- latest rollup interfaces with coverage metadata
- initial 12 swap rules with contexts and scores
- 3.1b re-scoring and activation workflow (`draft` -> reviewed subset `active`)
- 3.2a read-only FastAPI v0 endpoints using slug-based contracts

Out of scope:
- CI/bootstrap hosting
- rank 2 (garlic powder) rule activation before re-verification

## Artifacts

Data files:
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_food_culinary_roles_v1.csv`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_food_flavor_profiles_v1.csv`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_food_texture_profiles_v1.csv`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_food_cooking_behaviors_v1.csv`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_food_cuisine_affinities_v1.csv`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_trait_exemptions_v1.csv`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_swap_rules_mvp_v1.csv`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_rollup_default_thresholds_v1.csv`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/decisions/phase3_swap_activation_review_v1.csv`

SQL files:
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_traits_apply.sql`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_rollups_compute.sql`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_swap_rules_apply.sql`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_swap_rules_rescore.sql`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_swap_activation_apply.sql`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_swap_activation_checks.sql`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_mvp_checks.sql`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_rollups_6subtype_checks.sql`

API files:
- `/Users/fabiencampana/Documents/Fodmap/api/openapi/v0.yaml`
- `/Users/fabiencampana/Documents/Fodmap/api/app/main.py`
- `/Users/fabiencampana/Documents/Fodmap/api/app/routers/health.py`
- `/Users/fabiencampana/Documents/Fodmap/api/app/routers/foods.py`
- `/Users/fabiencampana/Documents/Fodmap/api/app/routers/swaps.py`

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

## MVP Locks

- ranks are resolved by `priority_rank -> phase2_priority_foods.resolved_food_id`
- source for curated product-layer data is `internal_rules_v1`
- trait exemption manifest exists but is empty (`0 rows`) for MVP
- 12 initial swap rules remain the MVP activation scope
- rank 2 is excluded from all swap rules

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
- `v_phase3_rollup_subtype_levels_latest`
- `v_phase3_rollups_latest_full`

Pipeline-managed snapshot artifacts:
- `phase3_subtype_levels_snapshot`
- `phase3_rollups_snapshot`
- both tables are rebuilt by `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_rollups_compute.sql`
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
  `/Users/fabiencampana/Documents/Fodmap/etl/phase3/decisions/phase3_swap_activation_review_v1.csv`
  via `\copy (SELECT ...) TO ... CSV HEADER`
- reviewer updates in place:
  - `review_decision` (`approve` or `reject`)
  - `review_notes`
  - `reviewed_by`
  - `reviewed_at`
- Gate B reads via `\copy ... FROM` and enforces snapshot lock against current score/version.

## 3.2a API Read Layer

v0 endpoints:
- `GET /v0/health`
- `GET /v0/foods/{food_slug}`
- `GET /v0/foods/{food_slug}/rollup`
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
- API rollup fields read from `v_phase3_rollups_latest_full`
- this view depends on pipeline-managed snapshots:
  - `phase3_subtype_levels_snapshot`
  - `phase3_rollups_snapshot`
- preflight before serving refreshed API data:
  - rerun `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_rollups_compute.sql`
  - rerun `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_rollups_6subtype_checks.sql`

## Rollback Strategy

If needed, remove source-scoped Phase 3 artifacts and rerun:

- traits: delete rows for priority food IDs from food trait junction tables
- rollups: delete `food_fodmap_rollups` rows where `source_id=internal_rules_v1`
- swaps: delete `swap_rule_scores`, `swap_rule_contexts`, then `swap_rules` where `notes='phase3_mvp_rule'` and source `internal_rules_v1`

Then rerun the standard execution order.
