# FODMAP Data Contract v1.1 (France)

This document defines the canonical SQL contract for the FODMAP planner and swap engine.

## 1) Canonical contract and scope

- Canonical source of truth: `/Users/fabiencampana/Documents/Fodmap/schema/fodmap_fr_schema.sql`
- JSON payloads are projections derived from SQL, not peer schemas.
- Scope in v1.1: schema hardening plus a reference CIQUAL ETL implementation.
- Out of scope in v1.1: API endpoint implementation and bulk data population.
- Reference ETL path: `/Users/fabiencampana/Documents/Fodmap/etl/ciqual/ciqual_etl.py`

## 2) Locked modeling decisions

1. Six FODMAP subtypes remain unchanged:
`fructose`, `lactose`, `fructan`, `gos`, `sorbitol`, `mannitol`
2. `polyols` is not a separate subtype (avoid double counting with sorbitol and mannitol).
3. Excess fructose is a derived signal, not a new subtype.
4. Swap rules remain first-class edges (`swap_rules`, `swap_rule_contexts`, `swap_rule_scores`).
5. Culinary traits are editorially curated canonical assignments (single assignment per food/trait code).
6. Rollup level distinguishes confirmed absence (`none`) from tolerated presence (`low`).

## 3) Key v1.1 schema changes

### 3.1 `fodmap_level` semantics

`fodmap_level` now includes `none`:

- `none`: confirmed absent for the assessed serving
- `low`: present but below threshold for the assessed serving
- `moderate`: amber risk
- `high`: red risk
- `unknown`: insufficient evidence

### 3.2 Excess fructose derivation interface

Two SQL views define the derived interface:

- `v_food_excess_fructose_measurements`
- `v_food_excess_fructose_latest`

Rule:

- compute `GREATEST(fructose - glucose, 0)` only when both observations are numeric-comparable
- numeric-comparable = comparator in `eq`, `lt`, `lte` and numeric value present
- otherwise computed value is `NULL` with a `derivation_status`

### 3.3 Culinary assignment simplification

Trait assignments are canonical per food/trait code:

- `food_culinary_roles` PK: `(food_id, role_code)`
- `food_flavor_profiles` PK: `(food_id, flavor_code)`
- `food_texture_profiles` PK: `(food_id, texture_code)`
- `food_cooking_behaviors` PK: `(food_id, behavior_code)`
- `food_cuisine_affinities` PK: `(food_id, cuisine_code)`

`source_id` remains optional metadata for traceability.

### 3.4 FR context and seasonality

Food-level FR context is explicit in `food_fr_contexts`:

- `availability` (`common`, `specialty`, `seasonal`, `rare`)
- `typical_retailers`
- `aop_aoc_igp`
- `peak_months`, `available_months` (month arrays constrained to 1..12)
- `imported_year_round`
- regional notes

### 3.5 Recipe bilingual parity

Added EN fields:

- `recipes.description_en`
- `recipe_ingredients.ingredient_text_en`
- `recipe_steps.instruction_en`

FR remains required for recipe steps and ingredient text.

### 3.6 FR allergen labels and UTF-8

`eu_allergens.annex_ii_name_fr` now uses accented official French labels.
Database and API should preserve UTF-8 without transliteration.

### 3.7 Canonical FR nullability for ingestion

`foods.canonical_name_fr` is nullable in v1.1.

Operational intent:

- CIQUAL ingestion can preserve nutrient observations even when FR labels are unresolved
- unresolved FR names are handled by a post-load quality gate, not by dropping rows
- production/CI workflows should fail the ETL command when unresolved FR names remain

## 4) Source and lookup seeds included in SQL

The SQL file now seeds:

- `data_licenses`
- `sources` (including `ciqual_2025`, `open_food_facts`, `monash_app_manual`, `expert_dietitian_panel`, `internal_rules_v1`, `muir_2007_fructan`, `biesiekierski_2011_fructan`, `dysseler_hoffem_gos`, `yao_2005_polyols`, `monash_app_v4_reference`)
- FR-first top-level `food_categories` (15 categories)
- `culinary_roles`, `flavor_notes`, `texture_traits`, `cooking_behaviors`, `cuisine_tags`
- `fodmap_subtypes`
- `eu_allergens`
- minimal `nutrient_definitions` for CIQUAL fructose/galactose/glucose/lactose/polyols/sugars

## 5) CIQUAL ingestion policy (value fidelity)

Always preserve both:

- raw value text (`amount_raw`)
- normalized numeric value + comparator (`amount_value`, `comparator`)

Typical mappings:

- `0,3` -> `comparator='eq'`, `amount_value=0.3`
- `< 0,2` -> `comparator='lt'`, `amount_value=0.2`
- `traces` -> `comparator='trace'`, `amount_value=NULL`
- missing/`-` -> `comparator='missing'`, `amount_value=NULL`

Reference implementation details:

- Hybrid ingestion contract: XLSX for nutrient observations, XML for FR identity/hierarchy
- `load` requires `--alim-xml` and `--alim-grp-xml`
- Category tree is persisted in `food_categories` with `source_system='ciqual_2025'`
- Aggregate rows (`alim_grp_code='00'`) are excluded from category membership assignment
- ETL exits non-zero when CIQUAL-linked foods still have `canonical_name_fr IS NULL`

## 6) Rollup rule for fructose risk

For FODMAP risk decisions, fructose is assessed using excess fructose (fructose minus glucose), not total fructose alone.

Practical examples:

- fructose=1.1 and glucose=0.8 -> excess=0.3
- fructose=`<0.2` and glucose missing -> excess=`NULL`, status=`missing_value`

## 7) SQL-to-JSON projection mapping

This section maps canonical SQL fields to common JSON payload fields used in app/API models.

| JSON concept | Canonical SQL source |
|---|---|
| `id`, names, scientific name | `foods` + `food_names` |
| `category`, `subcategory` | `food_category_memberships` + `food_categories` |
| `fodmap_profile.<subtype>` measurements | `food_fodmap_measurements` |
| subtype serving thresholds | `food_fodmap_thresholds` |
| fructose excess signal | `v_food_excess_fructose_latest` |
| overall level | `food_fodmap_rollups` |
| culinary roles/flavors/textures/behavior | trait lookup tables + canonical food_* junctions |
| cuisines | `food_cuisine_affinities` + `cuisine_tags` |
| swaps and scoring | `swap_rules`, `swap_rule_contexts`, `swap_rule_scores` |
| FR availability/seasonality | `food_fr_contexts` |
| provenance and confidence | `sources` + per-observation source links |
| allergens | `eu_allergens` + `food_allergens` |
| recipe FR/EN text | `recipes`, `recipe_ingredients`, `recipe_steps` |

## 8) P0 implementation order after hardening

1. Validate DDL on fresh Postgres instance.
2. Load dictionary/source seeds.
3. Load initial curated foods and trait assignments.
4. Load FODMAP measurements/thresholds with provenance.
5. Load initial swap rules + scores.
6. Verify JSON projection layer against SQL-to-JSON mapping.

## 9) Validation checklist

1. DDL applies without manual edits.
2. Template codes match seeded lookup/source codes.
3. Excess fructose views return expected computed/null cases.
4. `none` and `low` are both representable in rollups.
5. Duplicate canonical culinary assignment is rejected by PK constraints.
6. FR-only and FR+EN recipe writes both succeed.
7. French allergen labels keep expected diacritics.

## 10) Phase 2 Scaffold (Gap-Bucket Research Ops)

Phase 2 scaffold is organized by CIQUAL coverage gaps, not alphabetical food lists.

Bucket rationale:

- `fructan_dominant`: CIQUAL cannot directly provide fructan concentrations; prioritize key FR aromatics and grain bases.
- `gos_dominant`: CIQUAL does not expose direct GOS values; prioritize pulses, soy variants, and trigger nuts.
- `polyol_split_needed`: CIQUAL `total polyols` does not separate sorbitol vs mannitol; prioritize foods where split drives tolerance.

Scaffold artifacts:

- Priority template: `/Users/fabiencampana/Documents/Fodmap/schema/templates/phase2_priority_foods_by_gap_template.csv`
- Measurement template: `/Users/fabiencampana/Documents/Fodmap/schema/templates/fodmap_research_measurements_template.csv`
- Persistent table: `phase2_priority_foods` (seeded in canonical SQL)
- Helper views: `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_scaffold_views.sql`
- Existing DB setup/upsert: `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_priority_foods_setup.sql`
- Pass 1 deterministic resolver: `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_resolver_pass1.sql`
- Pass 2 candidate report (read-only): `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_resolver_pass2_candidates.sql`
- Validation queries: `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_validation_queries.sql`

`phase2_priority_foods` workflow fields:

- immutable planning identity: `priority_rank`, `gap_bucket`, `target_subtype`, `food_label`, `variant_label`
- lookup hints: `ciqual_code_hint`, `food_slug_hint`
- mutable resolution state: `resolved_food_id`, `resolution_method`, `resolution_notes`, `resolved_at`, `resolved_by`
- process status: `pending_research -> resolved -> measured -> threshold_set`

Template mapping rules:

- `amount_per_100g -> food_fodmap_measurements.amount_g_per_100g`
- `amount_per_serving -> food_fodmap_measurements.amount_g_per_serving`
- `citation_ref -> food_fodmap_measurements.source_record_ref`
- `source_slug -> sources.source_slug` then resolve to `source_id`
- `confidence_level` dual maps into:
  - `evidence_tier`
  - `confidence_score`

Default confidence mapping convention:

- `high -> evidence_tier=primary_lab, confidence_score=0.90`
- `medium -> evidence_tier=secondary_db, confidence_score=0.70`
- `low -> evidence_tier=inferred, confidence_score=0.50`

Phase 2 source slugs seeded in canonical SQL:

- `muir_2007_fructan`
- `biesiekierski_2011_fructan`
- `dysseler_hoffem_gos`
- `yao_2005_polyols`
- `monash_app_v4_reference`

Note:

Pass 2 is intentionally review-gated for safety:

- candidate matching is read-only and ranked (`top 10` per unresolved priority row)
- no fuzzy auto-resolution is applied
- final linking uses explicit manual `UPDATE` statements after review

Pass 3 (`new_food` creation for genuine non-CIQUAL variants) is intentionally deferred and not implemented in this phase.

## 10.1) Phase 2.3 Batch10 Mini-Ingestion (Resolved Cohort Only)

Batch10 proves the end-to-end Phase 2 data path on the currently resolved cohort before scaling additional resolution work.

Locked cohort (10 rows):

- `priority_rank IN (1,2,4,5,14,15,34,39,40,41)`
- one measurement row per rank for `target_subtype`
- one threshold row per rank for `target_subtype`

Batch10 artifacts:

- curated measurements CSV:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_batch10_measurements.csv`
- curated thresholds CSV:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_batch10_thresholds.csv`
- ingestion SQL:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_ingest_batch10.sql`
- status sync SQL:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_status_sync_batch10.sql`
- post-load checks:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_post_batch10_checks.sql`
- readiness matrix query:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_swap_readiness_batch10.sql`

Batch10 replay portability contract:

- `priority_rank` is authoritative.
- `food_id` column in Batch10 CSVs may be blank.
- ingest resolves `food_id` from `phase2_priority_foods.resolved_food_id` by `priority_rank`.
- if `food_id` is provided, ingest validates it matches the resolved rank mapping.

Batch10 source strategy:

- fructan measurements: `muir_2007_fructan` (with `biesiekierski_2011_fructan` fallback only when required)
- sorbitol and mannitol measurements: `yao_2005_polyols`
- thresholds: `monash_app_v4_reference` with deterministic `valid_from` date

Batch10 status transitions:

- `threshold_set` only when BOTH are true:
  - threshold exists for row target subtype from `monash_app_v4_reference`
  - current measurement exists (`food_fodmap_measurements.is_current = TRUE`) for row target subtype from Phase 2 sources
- `measured` when current measurement exists but threshold-set conjunction is not satisfied
- `resolved` otherwise (for resolved cohort rows with no current target-subtype measurement)

Batch10 quarantine workflow:

- rank 2 garlic powder (`priority_rank=2`) is soft-quarantined in:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_quarantine_rank2_garlic_powder.sql`
- quarantine marks suspect measurement rows as `is_current = FALSE` and appends a traceable note token
- quarantined rows remain in DB for audit and provenance
- readiness and completion logic now excludes non-current measurements
- dedicated checks are provided in:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_post_quarantine_checks.sql`

Batch10 acceptance gates:

- `phase2_priority_foods` remains `42` rows
- unresolved rows remain `32`
- unresolved no-candidate carryover remains `11`
- cohort current-measurement coverage = `9/10` (rank 2 quarantined)
- cohort threshold coverage = `10/10`
- cohort `threshold_set` status = `9/10`
- expected gap completion rows:
  - `fructan_dominant/fructan completed_rows = 5`
  - `polyol_split_needed/sorbitol completed_rows = 1`
  - `polyol_split_needed/mannitol completed_rows = 3`

Out of scope in Batch10:

- no schema DDL changes
- no Pass 3 food creation
- no fuzzy resolver changes
- no swap-rule authoring

## 10.2) Phase 2.4 Pod Execution Model (Proposal-Only)

Operating model:

- three research pods only: fructan, GOS, polyol
- no separate validator or integrator agents
- proposal-only outputs (CSV and SQL drafts) with human approval gate before apply
- wave size target = 6 foods (last wave can be shorter)

Wave order:

1. fructan wave 1: `3,6,7,8,9,10` (allium variants)
2. fructan wave 2: `11,12,13,16,17` (grain/artichoke/chicory fructans)
3. GOS wave 1: `18,19,20,21,22,23`
4. GOS wave 2: `24,25,26,27,28,29`
5. polyol wave 1: `30,31,32,33,35,36`
6. polyol wave 2: `37,38,42`

Note:

- rank `34` is intentionally absent from polyol waves because it is already resolved and ingested.

Per-wave artifact contract:

- wave manifest:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/decisions/phase2_wave_manifest.csv`
- pod runbook:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/POD_WAVES_RUNBOOK.md`
- decision ledger:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/decisions/phase2_<bucket>_wave<nn>_decisions.csv`
- measurements:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_<bucket>_wave<nn>_measurements.csv`
- thresholds:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_<bucket>_wave<nn>_thresholds.csv`
- optional Pass 3 new-food rows:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_<bucket>_wave<nn>_new_foods.csv`
- apply SQL draft:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_<bucket>_wave<nn>_apply.sql`
- post-check SQL:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_<bucket>_wave<nn>_checks.sql`

Shared Pass 3 creation rules:

- use `decision=create_new_food` when no safe CIQUAL mapping exists
- create foods with:
  - `food_slug`
  - `canonical_name_fr`
  - `canonical_name_en` when straightforward
  - `preparation_state`
  - `status='draft'`
- add deterministic custom reference:
  - `ref_system='CUSTOM'`
  - `ref_value='phase2_pass3:<priority_rank>'`
- link back to `phase2_priority_foods` with `resolution_method='new_food'`

## 10.3) Phase 2.5 Fructan Wave 1 (Executed)

Wave:

- `fructan_wave01` ranks `3,6,7,8,9,10`
- decision mode: all rows `create_new_food`
- wave branch contract: no canonical schema migration

Execution artifacts:

- decisions:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/decisions/phase2_fructan_wave01_decisions.csv`
- new-food definitions:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_fructan_wave01_new_foods.csv`
- measurements:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_fructan_wave01_measurements.csv`
- thresholds:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_fructan_wave01_thresholds.csv`
- apply SQL:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_fructan_wave01_apply.sql`
- checks SQL:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_fructan_wave01_checks.sql`

Wave 1 numeric anchors (fructan):

- rank 3 (`ail`, infused oil): `amount_per_100g=0.050000`, comparator `lt`
- rank 6 (`oignon`, powder): `4.500000` (proxy metadata downgraded)
- rank 7 (`oignon nouveau`, white bulb): `6.300000`
- rank 8 (`oignon nouveau`, green tops): `0.150000`
- rank 9 (`échalote`, raw bulb): `8.900000`
- rank 10 (`poireau`, white part): `7.100000`

Rank 6 provenance policy (locked):

- keep `source_slug='muir_2007_fructan'`
- set `evidence_tier='secondary_db'`
- set `confidence_score=0.700`
- set `citation_ref='muir2007_fructan_onion_powder_proxy'`
- include explicit note:
  - secondary Muir-derived proxy chain
  - not confirmed as direct Muir assay row
  - Monash app does not expose onion powder composition value

Dynamic candidate-pool gate:

- apply SQL snapshots baseline unresolved pools before mutation
- post-apply expected values are derived from:
  - baseline totals
  - how many wave ranks were unresolved with/without candidates at baseline
- this avoids brittle hardcoding when pool composition evolves between waves

Observed post-wave checkpoints:

- priority rows: `42`
- resolved links: `16`
- unresolved rows: `26`
- unresolved with candidates: `16`
- unresolved without candidates: `10`
- fructan completion row: `resolved_rows=12`, `completed_rows=11`, `pending_measurement_rows=1`

Safety continuity:

- rank 2 garlic powder remains soft-quarantined (`is_current=FALSE`)
- readiness/completion logic continues to exclude non-current measurements
- status contract remains conjunctive (`threshold_set` requires both current measurement and threshold)

## 10.4) Phase 2.5 Fructan Wave 2 (Executed)

Wave:

- `fructan_wave02` ranks `11,12,13,16,17`
- decision mode: all rows `create_new_food`
- wave branch contract: no canonical schema migration

Execution artifacts:

- decisions:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/decisions/phase2_fructan_wave02_decisions.csv`
- new-food definitions:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_fructan_wave02_new_foods.csv`
- measurements:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_fructan_wave02_measurements.csv`
- thresholds:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_fructan_wave02_thresholds.csv`
- apply SQL:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_fructan_wave02_apply.sql`
- checks SQL:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_fructan_wave02_checks.sql`

Wave 2 numeric anchors (fructan):

- rank 11 (`farine de blé`, T55): `0.550000`
- rank 12 (`farine de blé`, T65): `0.700000`
- rank 13 (`farine de blé`, T80): `1.100000`
- rank 16 (`artichaut`, globe heart): `2.840000`
- rank 17 (`racine de chicorée`, root): `20.000000`

Wave 2 evidence policy:

- wheat flour grades and chicory root are stored as proxy literature rows with:
  - `evidence_tier='secondary_db'`
  - `confidence_score=0.700`
- threshold rows use `source_slug='monash_app_v4_reference'` and remain `primary_lab`.

Dynamic candidate-pool gate:

- apply SQL snapshots baseline unresolved pools before mutation and derives post-wave expectations from baseline minus wave contribution.
- observed run:
  - baseline unresolved pools: `26/16/10` (total/with/without candidates)
  - post-wave unresolved pools: `21/15/6`

Observed post-wave checkpoints:

- priority rows: `42`
- resolved links: `21`
- unresolved rows: `21`
- fructan completion row: `resolved_rows=17`, `completed_rows=16`, `pending_measurement_rows=1`
- rank 2 quarantine invariant preserved (`is_current=FALSE` on suspect measurement path)

## 10.5) Phase 2.6 GOS Wave 1 (Executed)

Wave:

- `gos_wave01` ranks `18,19,20,21,22,23`
- decision mode: mixed path
  - `resolve_existing`: `18,19,20,22,23`
  - `create_new_food`: `21`
- wave branch contract: no canonical schema migration

Execution artifacts:

- decisions:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/decisions/phase2_gos_wave01_decisions.csv`
- new-food definitions:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_gos_wave01_new_foods.csv`
- measurements:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_gos_wave01_measurements.csv`
- thresholds:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_gos_wave01_thresholds.csv`
- apply SQL:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_gos_wave01_apply.sql`
- checks SQL:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_gos_wave01_checks.sql`

Selected `resolve_existing` mappings:

- rank 18 -> CIQUAL `20532` (`Pois chiche, appertisé, égoutté`)
- rank 19 -> CIQUAL `20587` (`Lentille verte, bouillie/cuite à l'eau`)
- rank 20 -> CIQUAL `20589` (`Lentille corail, bouillie/cuite à l'eau`)
- rank 22 -> CIQUAL `20502` (`Haricot blanc, bouilli/cuit à l'eau`)
- rank 23 -> CIQUAL `20503` (`Haricot rouge, bouilli/cuit à l'eau`)

Wave 1 numeric anchors (GOS):

- rank 18 (`pois chiche`, canned drained): `1.000000`
- rank 19 (`lentille`, green cooked): `0.900000`
- rank 20 (`lentille`, red cooked): `0.700000`
- rank 21 (`lentille`, brown cooked): `0.900000`
- rank 22 (`haricot blanc`, cooked): `2.000000`
- rank 23 (`haricot rouge`, cooked kidney bean): `1.700000`

Wave 1 evidence policy:

- all measurements use `source_slug='dysseler_hoffem_gos'` with:
  - `evidence_tier='secondary_db'`
  - `confidence_score=0.700`
- all thresholds use `source_slug='monash_app_v4_reference'` with:
  - `evidence_tier='primary_lab'`
  - `confidence_score=0.900`
  - `valid_from='2026-02-17'`

Status and readiness contract:

- `threshold_set` requires both:
  - current measurement (`food_fodmap_measurements.is_current = TRUE`) for target subtype
  - threshold for target subtype
- rows missing either requirement do not get promoted to `threshold_set`.

Dynamic candidate-pool gate:

- apply SQL snapshots baseline unresolved pools (`with_candidates`/`without_candidates`) before mutation and enforces computed deltas post-apply.
- this keeps validation stable even if candidate availability changes between waves.

Observed post-wave checkpoints:

- priority rows: `42`
- resolved links: `27`
- unresolved rows: `15`
- unresolved with candidates: `9`
- unresolved without candidates: `6`
- GOS completion row: `resolved_rows=6`, `completed_rows=6`, `unresolved_rows=6`, `pending_measurement_rows=0`
- rank 2 quarantine invariant preserved (`is_current=FALSE` on suspect measurement path)

## 10.6) Phase 2.6 GOS Wave 2 (Executed)

Wave:

- `gos_wave02` ranks `24,25,26,27,28,29`
- decision mode: mixed path
  - `resolve_existing`: `25`
  - `create_new_food`: `24,26,27,28,29`
- wave branch contract: no canonical schema migration

Execution artifacts:

- decisions:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/decisions/phase2_gos_wave02_decisions.csv`
- new-food definitions:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_gos_wave02_new_foods.csv`
- measurements:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_gos_wave02_measurements.csv`
- thresholds:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_gos_wave02_thresholds.csv`
- apply SQL:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_gos_wave02_apply.sql`
- checks SQL:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_gos_wave02_checks.sql`

Selected `resolve_existing` mapping:

- rank 25 -> CIQUAL `20506` (`Pois cassé, bouilli/cuit à l'eau`)

Create-row category split:

- `24,26,27 -> legumineuses`
- `28,29 -> noix_et_graines`

Wave 2 numeric anchors (GOS):

- rank 24 (`haricot noir`, cooked): `1.900000`
- rank 25 (`pois casse`, cooked): `1.600000`
- rank 26 (`edamame`, cooked): `0.800000`
- rank 27 (`soja`, whole cooked): `2.400000`
- rank 28 (`noix de cajou`, raw): `2.000000`
- rank 29 (`pistache`, raw): `0.900000`

Wave 2 evidence policy:

- all measurements use `source_slug='dysseler_hoffem_gos'` with:
  - `evidence_tier='secondary_db'`
  - `confidence_score=0.700`
- rank 28/29 include explicit proxy uncertainty notes (nut matrix variability, pending direct verification)
- all thresholds use `source_slug='monash_app_v4_reference'` with:
  - `evidence_tier='primary_lab'`
  - `confidence_score=0.900`
  - `valid_from='2026-02-17'`

Serving-band readout at wave serving sizes:

- rank 24: `high`
- rank 25: `high`
- rank 26: `moderate` (at `moderate_max` boundary)
- rank 27: `high`
- rank 28: `high`
- rank 29: `moderate`

Observed post-wave checkpoints:

- priority rows: `42`
- resolved links: `33`
- unresolved rows: `9`
- unresolved with candidates: `6`
- unresolved without candidates: `3`
- GOS completion row: `resolved_rows=12`, `completed_rows=12`, `unresolved_rows=0`, `pending_measurement_rows=0`
- rank 2 quarantine invariant preserved (`is_current=FALSE` on suspect measurement path)

## 10.7) Phase 2.7 Polyol Wave 1 (Executed)

Wave:

- `polyol_wave01` ranks `30,31,32,33,35,36`
- decision mode: mixed path
  - `resolve_existing`: `30,31,33,35,36`
  - `create_new_food`: `32`
- wave branch contract: no canonical schema migration

Execution artifacts:

- decisions:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/decisions/phase2_polyol_wave01_decisions.csv`
- new-food definitions:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_polyol_wave01_new_foods.csv`
- measurements:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_polyol_wave01_measurements.csv`
- thresholds:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_polyol_wave01_thresholds.csv`
- apply SQL:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_polyol_wave01_apply.sql`
- checks SQL:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_polyol_wave01_checks.sql`

Selected `resolve_existing` mappings:

- rank 30 -> CIQUAL `13039` (`Pomme, chair et peau, crue`)
- rank 31 -> CIQUAL `13037` (`Poire, chair et peau, crue`)
- rank 33 -> CIQUAL `13043` (`Pêche, chair et peau, sans noyau, crue`)
- rank 35 -> CIQUAL `13100` (`Prune, sans noyau, crue`) [fresh plum semantic verified]
- rank 36 -> CIQUAL `13042` (`Pruneau, sans noyau, sec`) [dried prune semantic verified]

Create-row contract:

- rank 32 created as `phase2-cerise-douce-crue`
- FR name: `Cerise douce, crue`
- EN name: `Sweet cherry, raw`
- preparation state: `raw`
- category: `fruits`
- deterministic custom reference: `phase2_pass3:32`

Wave 1 numeric anchors (sorbitol):

- rank 30 (`pomme`, raw): `0.700000`
- rank 31 (`poire`, raw): `2.000000`
- rank 32 (`cerise`, sweet raw): `2.200000`
- rank 33 (`peche`, raw): `0.800000`
- rank 35 (`prune`, raw): `1.400000`
- rank 36 (`pruneau`, dried): `8.000000`

Wave 1 threshold set (`source_slug='monash_app_v4_reference'`, `valid_from='2026-02-17'`):

- rank 30: `low=0.200000`, `moderate=0.500000`
- rank 31: `low=0.250000`, `moderate=0.600000`
- rank 32: `low=0.250000`, `moderate=0.600000`
- rank 33: `low=0.200000`, `moderate=0.500000`
- rank 35: `low=0.250000`, `moderate=0.600000`
- rank 36: `low=0.250000`, `moderate=0.600000`

Wave 1 evidence policy:

- measurements use `source_slug='yao_2005_polyols'` with:
  - `evidence_tier='secondary_db'`
  - `confidence_score=0.700`
- thresholds use `source_slug='monash_app_v4_reference'` with:
  - `evidence_tier='primary_lab'`
  - `confidence_score=0.900`

Observed post-wave checkpoints:

- priority rows: `42`
- resolved links: `39`
- unresolved rows: `3`
- unresolved with candidates: `1`
- unresolved without candidates: `2`
- polyol sorbitol completion row:
  - `priority_rows=7`, `resolved_rows=7`, `completed_rows=7`, `unresolved_rows=0`, `pending_measurement_rows=0`
- wave serving-band readout (at wave serving sizes): all six rows classify `high`

Safety continuity:

- rank 2 garlic powder remains soft-quarantined (`is_current=FALSE`)
- status and readiness remain conjunctive (`threshold_set` requires current measurement and threshold)

Next queue and backlog tracking:

- remaining unresolved ranks at this checkpoint: `37,38,42` (Polyol Wave 2 scope)
- replay-gap remediation scheduled immediately after Phase 2 completion

## 10.8) Phase 2.7 Polyol Wave 2 (Executed)

Wave:

- `polyol_wave02` ranks `37,38,42`
- decision mode: mixed path
  - `resolve_existing`: `37,42`
  - `create_new_food`: `38`
- wave branch contract: no canonical schema migration

Execution artifacts:

- decisions:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/decisions/phase2_polyol_wave02_decisions.csv`
- new-food definitions:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_polyol_wave02_new_foods.csv`
- measurements:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_polyol_wave02_measurements.csv`
- thresholds:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_polyol_wave02_thresholds.csv`
- apply SQL:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_polyol_wave02_apply.sql`
- checks SQL:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_polyol_wave02_checks.sql`

Selected `resolve_existing` mappings:

- rank 37 -> CIQUAL `20056` (`Champignon de Paris ou champignon de couche, cru`)
- rank 42 -> CIQUAL `20023` (`Céleri branche, cru`)

Create-row contract:

- rank 38 created as `phase2-shiitake-cru`
- FR name: `Shiitake, cru`
- EN name: `Shiitake mushroom, raw`
- preparation state: `raw`
- category: `legumes_et_verdures`
- deterministic custom reference: `phase2_pass3:38`

Wave 2 numeric anchors (mannitol):

- rank 37 (`champignon de paris`, button mushroom): `0.180000`
- rank 38 (`shiitake`, mushroom): `0.300000`
- rank 42 (`celeri`, stalk): `0.120000`

Wave 2 threshold set (`source_slug='monash_app_v4_reference'`, `valid_from='2026-02-18'`):

- rank 37: `low=0.050000`, `moderate=0.120000`
- rank 38: `low=0.050000`, `moderate=0.120000`
- rank 42: `low=0.060000`, `moderate=0.120000`

Wave 2 evidence policy:

- measurements use `source_slug='yao_2005_polyols'` with:
  - `evidence_tier='secondary_db'`
  - `confidence_score=0.700`
- thresholds use `source_slug='monash_app_v4_reference'` with:
  - `evidence_tier='primary_lab'`
  - `confidence_score=0.900`

Serving-band readout at wave serving sizes:

- rank 37: `high`
- rank 38: `high`
- rank 42: `moderate`

Observed post-wave checkpoints:

- priority rows: `42`
- resolved links: `42`
- unresolved rows: `0`
- unresolved with candidates: `0`
- unresolved without candidates: `0`
- polyol mannitol completion row:
  - `priority_rows=6`, `resolved_rows=6`, `completed_rows=6`, `unresolved_rows=0`, `pending_measurement_rows=0`

Safety continuity:

- rank 2 garlic powder remains soft-quarantined (`is_current=FALSE`)
- status and readiness remain conjunctive (`threshold_set` requires current measurement and threshold)

Phase 2 completion status:

- all 42 priority ranks are resolved, measured, and thresholded under current-measurement contract
- next mandatory track: replay-gap remediation (from-zero deterministic replay and artifact hardening)

## 10.9) Replay-gap remediation (From-zero deterministic replay)

Goal:

- guarantee replay reproducibility from a fresh database using durable SQL/CSV artifacts
- preserve historical Batch10 path and wave sequence
- enforce functional deterministic invariants rather than UUID identity equality

Replay artifacts:

- Batch01 decisions:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/decisions/phase2_batch01_decisions.csv`
- Batch01 apply:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_batch01_apply.sql`
- Batch01 checks:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_batch01_checks.sql`
- Final replay invariants:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_replay_final_checks.sql`
- Replay runner:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/scripts/phase2_replay_from_zero.sh`

Resolve-existing replay contract:

- `candidate_ciqual_code` is authoritative.
- `candidate_food_id` is optional metadata only.
- apply scripts resolve runtime target from `food_external_refs` where `ref_system='CIQUAL'`.
- uniqueness guard is mandatory: each `candidate_ciqual_code` must resolve to exactly one `food_id`
  (`COUNT(DISTINCT food_id)=1`) or preflight fails.

Replay sequence (locked):

1. drop/create replay database
2. apply canonical schema
3. run CIQUAL ETL load
4. apply `phase2_priority_foods_setup.sql`
5. apply `phase2_scaffold_views.sql`
6. apply `phase2_resolver_pass2_candidates.sql`
7. apply `phase2_resolver_pass1.sql`
8. apply/check Batch01
9. apply Batch10 ingest + quarantine + status + post-batch10 checks
10. apply/check all six waves in historical order
11. apply `phase2_replay_final_checks.sql`

Final deterministic invariants:

- priority state: total `42`, resolved `42`, unresolved `0`
- gap completion:
  - fructan `17/17/16/0/1` (`priority/resolved/completed/unresolved/pending`)
  - gos `12/12/12/0/0`
  - sorbitol `7/7/7/0/0`
  - mannitol `6/6/6/0/0`
- unresolved candidate pools: with candidates `0`, without candidates `0`
- rank2 quarantine continuity: `0` current target-subtype measurements
- no duplicate phase2 measurement signatures
- `phase2_pass3:*` custom refs:
  - count `19`
  - distinct count `19`

Current backlog marker:

- replay-gap remediation is now implemented as runnable artifacts
- any CI dataset-version drift should be handled by updating expected pool baselines/check thresholds in dedicated follow-up PRs

## 11) Phase 3 SQL Product Layer MVP

Phase 3.0 introduces SQL-first product-layer curation on top of completed Phase 2 food resolution and measurements.

Scope:

- culinary trait assignments for all `42` priority foods
- source-scoped serving rollups in `food_fodmap_rollups`
- initial `12` swap rules with contexts and scores (still `draft` in 3.1a)

Artifacts:

- runbook:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase3/PRODUCT_LAYER_RUNBOOK.md`
- trait files:
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_food_culinary_roles_v1.csv`
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_food_flavor_profiles_v1.csv`
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_food_texture_profiles_v1.csv`
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_food_cooking_behaviors_v1.csv`
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_food_cuisine_affinities_v1.csv`
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_trait_exemptions_v1.csv`
- rule file:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_swap_rules_mvp_v1.csv`
- rollup defaults:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_rollup_default_thresholds_v1.csv`
- SQL pipeline:
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_traits_apply.sql`
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_rollups_compute.sql`
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_swap_rules_apply.sql`
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_swap_rules_rescore.sql`
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_swap_activation_apply.sql`
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_swap_activation_checks.sql`
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_mvp_checks.sql`
- review packet:
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/decisions/phase3_swap_activation_review_v1.csv`

### 11.1 Rollup semantics (Phase 3.1a full 6-subtype)

Phase 3.1a upgrades rollups from target-subtype-only to full six-subtype evaluation:

- subtype set: `fructan`, `gos`, `sorbitol`, `mannitol`, `fructose` (excess), `lactose`
- overall rollup = worst-known subtype severity
- coverage is explicit per food:
  - `known_subtypes_count`
  - `coverage_ratio`
- `none` is only valid when coverage is full (`6/6`) and all subtype levels are `none`
- partial coverage + all-known-none is coerced to `unknown`

Read interfaces:

- `v_phase3_rollup_subtype_levels_latest` (food x subtype detail)
- `v_phase3_rollups_latest_full` (one row per food with coverage + driver)

Pipeline-managed snapshot artifacts:

- `phase3_subtype_levels_snapshot`
- `phase3_rollups_snapshot`
- both are internal artifacts rebuilt by `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_rollups_compute.sql`
- do not edit directly; rerun rollup compute after upstream data changes to refresh them

Signal precedence by subtype:

1. explicit current subtype measurements (`food_fodmap_measurements`, `is_current=TRUE`)
2. fructose excess from `v_food_excess_fructose_latest` only when explicit fructose signal is absent
3. lactose from CIQUAL nutrient `CIQUAL_32410` only when explicit lactose signal is absent
4. sorbitol/mannitol fallback from CIQUAL total polyols `CIQUAL_34000` only when explicit subtype signal is missing

Threshold precedence:

- food-specific threshold first (`food_fodmap_thresholds`)
- then global fallback defaults from:
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_rollup_default_thresholds_v1.csv`

Fallback threshold citation policy:

- `source_slug=internal_rules_v1`
- `citation_ref=monash_app_v4_reference + phase2_threshold_median_pack_2026-02-18`
- `derivation_method=median_template_pack_v1`

Coverage baseline note:

- snapshot `1/6:21, 3/6:6, 4/6:10, 5/6:5` is a pre-3.1a baseline diagnostic from linked signals before full rollup wiring
- unchanged inputs keep coverage distribution unchanged
- coverage increases only when new linked signals are introduced (additional subtype measurements and/or nutrient linkage)
- these buckets are diagnostic outputs, not hard assertions

### 11.2 Trait coverage and exemption policy

MVP trait checks enforce minimum coverage for each of the 42 foods:

- `>=1` culinary role
- `>=2` flavor notes
- `>=1` texture
- `>=1` cooking behavior
- `>=1` cuisine affinity

An exemption mechanism is present via:

- `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_trait_exemptions_v1.csv`

MVP lock:

- exemption file must stay empty (`0` rows)
- neutral/default assignments are used instead of exemptions

### 11.3 Swap-rule MVP policy

- initial batch = `12` rules
- initial insertion status = `draft` for all rules
- rank 2 (`ail`, powder) is excluded from from/to rule graph until measurement re-verification
- rule contexts and scores are seeded alongside rules for deterministic downstream projection

### 11.4 Swap activation workflow (Phase 3.1b)

Phase 3.1b activates a reviewed subset of the 12 MVP rules in two gates:

1. Gate A (`phase3_swap_rules_rescore.sql`):
   - recompute `swap_rule_scores.fodmap_safety_score` from full rollups
   - set `scoring_version='v2_full_rollup_2026_02_18'`
   - export reviewer packet via
     `\copy (SELECT ...) TO '/Users/fabiencampana/Documents/Fodmap/etl/phase3/decisions/phase3_swap_activation_review_v1.csv'`

2. Gate B (`phase3_swap_activation_apply.sql`):
   - load reviewed CSV via `\copy ... FROM`
   - enforce score/version snapshot lock
   - enforce conservative eligibility before activation
   - apply status transitions:
     - `approve -> active`
     - `reject -> draft`

Unknown endpoint handling (locked):

- if either endpoint rollup level is `unknown`, recomputed `fodmap_safety_score` is short-circuited to `0.000`
- unknown endpoint rows are never auto-eligible

Conservative eligibility rule:

- endpoints must be non-unknown
- `to` severity must be non-worsening (`to <= from`)
- `to_burden_ratio <= from_burden_ratio`
- recomputed safety score `>= 0.500`

Human review fields required in the activation CSV:

- `review_decision` (`approve` or `reject`)
- `review_notes`
- `reviewed_by`
- `reviewed_at`

Rows not approved remain `draft`.

### 11.5 API v0 read layer (Phase 3.2a)

Phase 3.2a adds a read-only FastAPI surface over existing SQL contracts.

Endpoint set:

- `GET /v0/foods?q={text}&limit={1..50}`
- `GET /v0/health`
- `GET /v0/foods/{food_slug}`
- `GET /v0/foods/{food_slug}/rollup`
- `GET /v0/foods/{food_slug}/subtypes`
- `GET /v0/foods/{food_slug}/traits`
- `GET /v0/swaps?from={food_slug}&limit={int}&min_safety_score={0..1}`

Public API contracts:

- public identity is `food_slug` (priority ranks remain internal)
- responses include both `*_fr` and `*_en` fields
- no locale negotiation in v0
- swaps return only `active` rules
- rank2 exclusion remains inherited from activation state and safety checks

Swap sorting contract:

1. `fodmap_safety_score DESC`
2. `overall_score DESC`
3. `to_overall_level` severity ASC (`none`, `low`, `moderate`, `high`, `unknown`)
4. `coverage_ratio DESC`
5. `to_food_slug ASC`

Rollup freshness contract:

- API rollup projections come from `v_phase3_rollups_latest_full`
- this depends on pipeline-managed snapshots rebuilt by:
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/sql/phase3_rollups_compute.sql`
- API responses expose freshness/provenance fields:
  - `rollup_computed_at`
  - `scoring_version`
  - `source_slug`

Subtype informative contract (`/v0/foods/{food_slug}/subtypes`):

- one row per subtype from `v_phase3_rollup_subtype_levels_latest`
- required analysis fields:
  - `subtype_code`, `subtype_level`
  - `amount_g_per_serving`, `comparator`
  - `low_max_g`, `moderate_max_g`
  - `burden_ratio`
- provenance fields:
  - `signal_source_kind`, `signal_source_slug`
  - `threshold_source_slug`, `is_default_threshold`, `is_polyol_proxy`
- freshness/context:
  - `rollup_serving_g`
  - `computed_at`

### 11.6 Systematic swap expansion Batch01 (Phase 3.3)

Batch01 introduces additive rule expansion on top of the MVP swap set.

Locked scope:

- candidate universe restricted to priority ranks `1..42`
- rank 2 remains excluded from both `from` and `to`
- no schema migration; existing swap tables and constraints reused

Batch01 artifacts:

- generated candidates:
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_swap_rules_batch01_generated_v1.csv`
- allergen gate mapping:
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_food_allergen_families_v1.csv`
- review packet:
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/decisions/phase3_swap_batch01_review_v1.csv`
- SQL flow:
  - `phase3_swap_rules_batch01_generate.sql`
  - `phase3_swap_rules_batch01_apply.sql`
  - `phase3_swap_rules_batch01_rescore.sql`
  - `phase3_swap_rules_batch01_activation_apply.sql`
  - `phase3_swap_rules_batch01_checks.sql`

Generation and selection policy:

- conservative pre-filter:
  - known endpoint levels
  - non-worsening level (`to <= from`)
  - non-worsening burden (`to_burden_ratio <= from_burden_ratio`)
- ranking score:
  - `0.75 * fodmap_safety_score`
  - `0.15 * flavor_match_score`
  - `0.05 * texture_match_score`
  - `0.05 * method_match_score`
- selection:
  - provisional global top 40
  - post-top40 per-source cap (`<=5` per `from_rank`)
  - ranked waitlist backfill
  - final selected count bounded to `1..40`

Batch01 review/activation policy:

- decisions allowed: `approve`, `reject`, `defer`
- snapshot lock enforced on:
  - `scoring_version_snapshot`
  - `fodmap_safety_score_snapshot`
- conservative gate re-evaluated at activation time; ineligible `approve` fails fast
- status transitions:
  - `approve -> active`
  - `reject|defer -> draft`

Strict second-review trigger:

- `to_coverage_ratio < 0.50`
- OR `fodmap_safety_score < 0.60`
- OR cross-category substitution
- OR allergen-family change (`from` set != `to` set, excluding `none`)

When `second_review_required=true` and final decision is `approve`:

- `second_review_decision='approve'`
- `second_reviewed_by` required
- `second_reviewed_at` required and valid timestamptz

### 11.7 Systematic swap expansion Batch02 delta (Phase 3.4)

Batch02 is additive to MVP + Batch01 and keeps the same 42-food universe.

Locked Batch02 delta:

- `rule_kind='direct_swap'` only
- same-subtype hard gate for all generated rows:
  - `from_driver_subtype = to_driver_subtype`
- existing open direct-swap exclusions apply in both directions:
  - exact `(from,to)`
  - reverse `(to,from)`
- selection contract unchanged:
  - final count bounded to `1..40`
  - per-from cap `<=5`
  - per-to cap `<=5`
  - deterministic backfill after cap trimming

Batch02 artifacts:

- generated candidates:
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_swap_rules_batch02_generated_v1.csv`
- review packet:
  - `/Users/fabiencampana/Documents/Fodmap/etl/phase3/decisions/phase3_swap_batch02_review_v1.csv`
- SQL flow:
  - `phase3_swap_rules_batch02_generate.sql`
  - `phase3_swap_rules_batch02_apply.sql`
  - `phase3_swap_rules_batch02_rescore.sql`
  - `phase3_swap_rules_batch02_activation_apply.sql`
  - `phase3_swap_rules_batch02_checks.sql`

Batch02 generated/review packets include explicit subtype audit columns:

- `from_driver_subtype`
- `to_driver_subtype`

Issue #25 execution contract:

- run through generate/apply/rescore/checks only
- activation is deferred to a later human-reviewed pass by design

## 12) References

- CIQUAL 2025 composition dataset (Etalab 2.0):
  - https://entrepot.recherche.data.gouv.fr/dataset.xhtml?persistentId=doi:10.57745/RDMHWY
- CIQUAL 2025 average foods table:
  - https://entrepot.recherche.data.gouv.fr/dataset.xhtml?persistentId=doi:10.57745/XOJCLN
- ANSES CIQUAL overview:
  - https://www.anses.fr/en/content/ciqual-food-composition-table
- Open Food Facts data/API/licenses:
  - https://world.openfoodfacts.org/data
- Regulation (EU) No 1169/2011, Annex II allergens:
  - https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02011R1169-20180101
- Monash app notes and serving-based logic:
  - https://www.monashfodmap.com/blog/app-how-to/
- Monash lab testing process:
  - https://www.monashfodmap.com/blog/fodmap-testing-lab/
