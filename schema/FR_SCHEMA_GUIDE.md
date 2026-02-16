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

## 4) Source and lookup seeds included in SQL

The SQL file now seeds:

- `data_licenses`
- `sources` (including `ciqual_2025`, `open_food_facts`, `monash_app_manual`, `expert_dietitian_panel`, `internal_rules_v1`)
- FR-first top-level `food_categories` (15 categories)
- `culinary_roles`, `flavor_notes`, `texture_traits`, `cooking_behaviors`, `cuisine_tags`
- `fodmap_subtypes`
- `eu_allergens`
- minimal `nutrient_definitions` for CIQUAL fructose/glucose/lactose/polyols/sugars

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

## 10) References

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
