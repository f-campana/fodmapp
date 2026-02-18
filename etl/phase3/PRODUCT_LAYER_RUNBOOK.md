# Phase 3 Product Layer Runbook (SQL MVP)

This runbook defines the SQL-first product-layer execution on top of completed Phase 2 data.

## Scope

Phase 3.0 MVP includes:
- culinary trait curation for priority ranks `1..42`
- source-scoped rollups in `food_fodmap_rollups`
- initial 12 `draft` swap rules with contexts and scores

Out of scope:
- API endpoints
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

SQL files:
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_traits_apply.sql`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_rollups_compute.sql`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_swap_rules_apply.sql`
- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_mvp_checks.sql`

## Execution Order

Run against `fodmap_test` in this exact order:

1. `phase3_traits_apply.sql`
2. `phase3_rollups_compute.sql`
3. `phase3_swap_rules_apply.sql`
4. `phase3_mvp_checks.sql`

Idempotency pass (same order, second run):

1. `phase3_traits_apply.sql`
2. `phase3_rollups_compute.sql`
3. `phase3_swap_rules_apply.sql`
4. `phase3_mvp_checks.sql`

## MVP Locks

- ranks are resolved by `priority_rank -> phase2_priority_foods.resolved_food_id`
- source for curated product-layer data is `internal_rules_v1`
- trait exemption manifest exists but is empty (`0 rows`) for MVP
- 12 initial swap rules are all `draft`
- rank 2 is excluded from all swap rules

## Rollup Semantics (MVP)

Rollups are target-subtype-only and do not represent full 6-subtype overall risk yet:
- driver subtype = `phase2_priority_foods.target_subtype`
- serving from threshold for target subtype (fallback: provisional serving)
- `unknown` if no current target-subtype measurement or no threshold

## Rollback Strategy

If needed, remove source-scoped Phase 3 artifacts and rerun:

- traits: delete rows for priority food IDs from food trait junction tables
- rollups: delete `food_fodmap_rollups` rows where `source_id=internal_rules_v1`
- swaps: delete `swap_rule_scores`, `swap_rule_contexts`, then `swap_rules` where `notes='phase3_mvp_rule'` and source `internal_rules_v1`

Then rerun the standard execution order.
