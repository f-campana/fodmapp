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

## 11) References

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
