# Phase 3 Product Layer Runbook (SQL MVP)

This runbook defines the SQL-first product-layer execution on top of completed Phase 2 data.

## Scope

Phase 3.0/3.1a includes:
- culinary trait curation for priority ranks `1..42`
- full 6-subtype source-scoped rollups in `food_fodmap_rollups`
- latest rollup interfaces with coverage metadata
- initial 12 `draft` swap rules with contexts and scores

Out of scope:
- API endpoints
- CI/bootstrap hosting
- rank 2 (garlic powder) rule activation before re-verification
- 3.1b swap activation workflow (post-3.1a)

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

SQL files:
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_traits_apply.sql`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_rollups_compute.sql`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_swap_rules_apply.sql`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_mvp_checks.sql`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_rollups_6subtype_checks.sql`

## Execution Order

Run against `fodmap_test` in this exact order:

1. `phase3_traits_apply.sql`
2. `phase3_rollups_compute.sql`
3. `phase3_rollups_6subtype_checks.sql`
4. `phase3_swap_rules_apply.sql`
5. `phase3_mvp_checks.sql`

Idempotency pass (same order, second run):

1. `phase3_traits_apply.sql`
2. `phase3_rollups_compute.sql`
3. `phase3_rollups_6subtype_checks.sql`
4. `phase3_swap_rules_apply.sql`
5. `phase3_mvp_checks.sql`

## MVP Locks

- ranks are resolved by `priority_rank -> phase2_priority_foods.resolved_food_id`
- source for curated product-layer data is `internal_rules_v1`
- trait exemption manifest exists but is empty (`0 rows`) for MVP
- 12 initial swap rules are all `draft`
- rank 2 is excluded from all swap rules

## Rollup Semantics (3.1a Full Rollups)

Rollups evaluate all six subtypes (`fructan`, `gos`, `sorbitol`, `mannitol`, `fructose` excess, `lactose`) with worst-known severity semantics:
- coverage metrics are explicit: `known_subtypes_count`, `coverage_ratio`
- `none` is only allowed with full 6/6 coverage and all subtype levels `none`
- partial coverage + all-known-none is coerced to `unknown`
- sorbitol/mannitol may use CIQUAL total-polyols fallback only when explicit subtype measurements are missing
- threshold precedence: food-specific first, then global defaults (`phase3_rollup_default_thresholds_v1.csv`)

Read interfaces:
- `v_phase3_rollup_subtype_levels_latest`
- `v_phase3_rollups_latest_full`

Coverage baseline note:
- snapshot `1/6:21, 3/6:6, 4/6:10, 5/6:5` is a pre-3.1a baseline diagnostic
- post-compute coverage can increase when CIQUAL-derived lactose/excess-fructose joins are active
- baseline buckets are diagnostic only, not hard assertions

## Rollback Strategy

If needed, remove source-scoped Phase 3 artifacts and rerun:

- traits: delete rows for priority food IDs from food trait junction tables
- rollups: delete `food_fodmap_rollups` rows where `source_id=internal_rules_v1`
- swaps: delete `swap_rule_scores`, `swap_rule_contexts`, then `swap_rules` where `notes='phase3_mvp_rule'` and source `internal_rules_v1`

Then rerun the standard execution order.
