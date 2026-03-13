BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE evidence_tier AS ENUM (
  'primary_lab',
  'secondary_db',
  'inferred'
);

CREATE TYPE comparator_code AS ENUM (
  'eq',
  'lt',
  'lte',
  'gt',
  'gte',
  'trace',
  'nd',
  'missing'
);

CREATE TYPE measurement_basis AS ENUM (
  'per_100g',
  'per_100ml',
  'per_serving'
);

CREATE TYPE preparation_state AS ENUM (
  'raw',
  'cooked',
  'processed',
  'fermented',
  'rehydrated',
  'unknown'
);

CREATE TYPE fodmap_level AS ENUM (
  'none',
  'low',
  'moderate',
  'high',
  'unknown'
);

CREATE TYPE swap_status AS ENUM (
  'draft',
  'active',
  'deprecated'
);

CREATE TYPE tolerance_level AS ENUM (
  'tolerates',
  'moderate',
  'cannot_tolerate',
  'unknown'
);

CREATE TYPE fr_availability AS ENUM (
  'common',
  'specialty',
  'seasonal',
  'rare'
);

CREATE TYPE fr_retailer AS ENUM (
  'supermarche',
  'marche',
  'bio',
  'epicerie_fine',
  'asiatique',
  'en_ligne'
);

CREATE TABLE data_licenses (
  license_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spdx_id TEXT UNIQUE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sources (
  source_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_slug TEXT NOT NULL UNIQUE,
  source_name TEXT NOT NULL,
  source_kind TEXT NOT NULL CHECK (
    source_kind IN (
      'official_database',
      'lab',
      'research_paper',
      'app_vendor',
      'community',
      'internal'
    )
  ),
  organization TEXT,
  country_code CHAR(2),
  citation TEXT,
  url TEXT,
  dataset_version TEXT,
  published_at DATE,
  accessed_at TIMESTAMPTZ,
  trust_tier evidence_tier NOT NULL DEFAULT 'secondary_db',
  is_commercial BOOLEAN NOT NULL DEFAULT FALSE,
  license_id UUID REFERENCES data_licenses (license_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE source_files (
  source_file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES sources (source_id),
  file_name TEXT NOT NULL,
  persistent_id TEXT,
  file_format TEXT,
  checksum_sha256 TEXT,
  imported_at TIMESTAMPTZ,
  UNIQUE (source_id, persistent_id)
);

CREATE TABLE ingestion_runs (
  ingestion_run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES sources (source_id),
  pipeline_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  records_read BIGINT NOT NULL DEFAULT 0,
  records_loaded BIGINT NOT NULL DEFAULT 0,
  records_error BIGINT NOT NULL DEFAULT 0,
  notes TEXT
);

CREATE TABLE food_categories (
  category_id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE,
  parent_category_id BIGINT REFERENCES food_categories (category_id),
  name_fr TEXT NOT NULL,
  name_en TEXT,
  level SMALLINT CHECK (level BETWEEN 1 AND 4),
  source_system TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE foods (
  food_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_slug TEXT NOT NULL UNIQUE,
  canonical_name_fr TEXT,
  canonical_name_en TEXT,
  scientific_name TEXT,
  description_fr TEXT,
  preparation_state preparation_state NOT NULL DEFAULT 'unknown',
  default_serving_g NUMERIC(8,2) CHECK (default_serving_g IS NULL OR default_serving_g > 0),
  edible_portion_pct NUMERIC(5,2) CHECK (
    edible_portion_pct IS NULL OR (edible_portion_pct >= 0 AND edible_portion_pct <= 100)
  ),
  density_g_per_ml NUMERIC(8,4) CHECK (density_g_per_ml IS NULL OR density_g_per_ml > 0),
  is_branded_product BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'deprecated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (canonical_name_fr, preparation_state)
);

CREATE TABLE safe_harbor_cohorts (
  cohort_code TEXT PRIMARY KEY CHECK (
    cohort_code IN ('cohort_oil_fat', 'cohort_plain_protein', 'cohort_egg')
  ),
  label_fr TEXT NOT NULL,
  label_en TEXT NOT NULL,
  rationale_fr TEXT NOT NULL,
  rationale_en TEXT NOT NULL,
  caveat_fr TEXT NOT NULL,
  caveat_en TEXT NOT NULL,
  sort_order SMALLINT NOT NULL CHECK (sort_order >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE food_safe_harbor_assignments (
  food_id UUID PRIMARY KEY REFERENCES foods (food_id) ON DELETE CASCADE,
  cohort_code TEXT NOT NULL REFERENCES safe_harbor_cohorts (cohort_code),
  rule_source_id UUID NOT NULL REFERENCES sources (source_id),
  data_source_id UUID NOT NULL REFERENCES sources (source_id),
  assignment_version TEXT NOT NULL,
  assignment_method TEXT NOT NULL CHECK (assignment_method IN ('ciqual_category_gate_v1')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (length(trim(assignment_version)) > 0)
);

CREATE INDEX idx_food_safe_harbor_assignments_cohort
  ON food_safe_harbor_assignments (cohort_code, updated_at DESC, food_id);

CREATE INDEX idx_food_safe_harbor_assignments_data_source
  ON food_safe_harbor_assignments (data_source_id, rule_source_id);

CREATE TABLE food_names (
  food_name_id BIGSERIAL PRIMARY KEY,
  food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  locale_code TEXT NOT NULL DEFAULT 'fr-FR',
  name TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  source_id UUID REFERENCES sources (source_id),
  UNIQUE (food_id, locale_code, name)
);

CREATE TABLE food_category_memberships (
  food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES food_categories (category_id),
  source_id UUID REFERENCES sources (source_id),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (food_id, category_id, source_id)
);

CREATE TABLE food_external_refs (
  food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  ref_system TEXT NOT NULL CHECK (
    ref_system IN (
      'CIQUAL',
      'OPEN_FOOD_FACTS',
      'MONASH',
      'FODMAP_FRIENDLY',
      'USDA',
      'EAN13',
      'CUSTOM'
    )
  ),
  ref_value TEXT NOT NULL,
  source_id UUID REFERENCES sources (source_id),
  country_code CHAR(2) NOT NULL DEFAULT 'FR',
  valid_from DATE,
  valid_to DATE,
  PRIMARY KEY (food_id, ref_system, ref_value)
);

CREATE TABLE food_fr_contexts (
  food_id UUID PRIMARY KEY REFERENCES foods (food_id) ON DELETE CASCADE,
  availability fr_availability NOT NULL DEFAULT 'common',
  typical_retailers fr_retailer[] NOT NULL DEFAULT '{}',
  aop_aoc_igp TEXT,
  peak_months SMALLINT[] NOT NULL DEFAULT '{}',
  available_months SMALLINT[] NOT NULL DEFAULT '{}',
  imported_year_round BOOLEAN NOT NULL DEFAULT FALSE,
  regional_notes_fr TEXT,
  regional_notes_en TEXT,
  source_id UUID REFERENCES sources (source_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_food_fr_peak_months CHECK (
    peak_months <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::SMALLINT[]
  ),
  CONSTRAINT chk_food_fr_available_months CHECK (
    available_months <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::SMALLINT[]
  )
);

CREATE TABLE nutrient_definitions (
  nutrient_id BIGSERIAL PRIMARY KEY,
  nutrient_code TEXT NOT NULL UNIQUE,
  infoods_code TEXT,
  name_fr TEXT NOT NULL,
  name_en TEXT,
  unit TEXT NOT NULL,
  default_basis measurement_basis NOT NULL DEFAULT 'per_100g',
  is_fodmap_relevant BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT
);

CREATE TABLE food_nutrient_observations (
  observation_id BIGSERIAL PRIMARY KEY,
  food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  nutrient_id BIGINT NOT NULL REFERENCES nutrient_definitions (nutrient_id),
  source_id UUID NOT NULL REFERENCES sources (source_id),
  source_record_ref TEXT,
  amount_raw TEXT NOT NULL,
  comparator comparator_code NOT NULL DEFAULT 'eq',
  amount_value NUMERIC(12,6),
  min_value NUMERIC(12,6),
  max_value NUMERIC(12,6),
  basis measurement_basis NOT NULL DEFAULT 'per_100g',
  serving_g NUMERIC(8,2),
  confidence_code TEXT,
  confidence_score NUMERIC(4,3) CHECK (
    confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)
  ),
  observed_at DATE,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fodmap_subtypes (
  fodmap_subtype_id SMALLSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE CHECK (
    code IN ('fructose', 'lactose', 'fructan', 'gos', 'sorbitol', 'mannitol')
  ),
  family TEXT NOT NULL CHECK (
    family IN ('monosaccharide', 'disaccharide', 'oligosaccharide', 'polyol')
  ),
  display_name_fr TEXT NOT NULL,
  display_name_en TEXT NOT NULL,
  is_polyol BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE phase2_priority_foods (
  priority_rank INTEGER PRIMARY KEY CHECK (priority_rank > 0),
  gap_bucket TEXT NOT NULL CHECK (
    gap_bucket IN ('fructan_dominant', 'gos_dominant', 'polyol_split_needed')
  ),
  target_subtype TEXT NOT NULL REFERENCES fodmap_subtypes (code),
  food_label TEXT NOT NULL,
  variant_label TEXT NOT NULL,
  ciqual_code_hint TEXT,
  food_slug_hint TEXT,
  resolved_food_id UUID REFERENCES foods (food_id),
  resolution_method TEXT CHECK (
    resolution_method IN ('ciqual_code', 'slug_match', 'name_match', 'manual', 'new_food')
  ),
  resolution_notes TEXT,
  serving_g_provisional NUMERIC(8,2) NOT NULL CHECK (serving_g_provisional > 0),
  source_strategy TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_research' CHECK (
    status IN ('pending_research', 'resolved', 'measured', 'threshold_set')
  ),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (food_label, variant_label)
);

CREATE TABLE food_fodmap_measurements (
  measurement_id BIGSERIAL PRIMARY KEY,
  food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  fodmap_subtype_id SMALLINT NOT NULL REFERENCES fodmap_subtypes (fodmap_subtype_id),
  source_id UUID NOT NULL REFERENCES sources (source_id),
  source_record_ref TEXT,
  amount_raw TEXT NOT NULL,
  comparator comparator_code NOT NULL DEFAULT 'eq',
  amount_g_per_100g NUMERIC(12,6),
  amount_g_per_serving NUMERIC(12,6),
  serving_g NUMERIC(8,2),
  method TEXT NOT NULL CHECK (
    method IN ('lab', 'literature', 'derived_from_nutrient', 'expert_estimate', 'user_report')
  ),
  evidence_tier evidence_tier NOT NULL DEFAULT 'secondary_db',
  confidence_score NUMERIC(4,3) CHECK (
    confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)
  ),
  observed_at DATE,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE food_fodmap_thresholds (
  threshold_id BIGSERIAL PRIMARY KEY,
  food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  fodmap_subtype_id SMALLINT NOT NULL REFERENCES fodmap_subtypes (fodmap_subtype_id),
  source_id UUID NOT NULL REFERENCES sources (source_id),
  serving_g NUMERIC(8,2) NOT NULL CHECK (serving_g > 0),
  low_max_g NUMERIC(12,6),
  moderate_max_g NUMERIC(12,6),
  threshold_basis TEXT NOT NULL DEFAULT 'per_serving' CHECK (threshold_basis = 'per_serving'),
  evidence_tier evidence_tier NOT NULL DEFAULT 'secondary_db',
  confidence_score NUMERIC(4,3) CHECK (
    confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)
  ),
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_to DATE,
  notes TEXT,
  CONSTRAINT chk_threshold_order CHECK (
    (low_max_g IS NULL AND moderate_max_g IS NULL)
    OR (low_max_g IS NOT NULL AND moderate_max_g IS NOT NULL AND low_max_g <= moderate_max_g)
  ),
  UNIQUE (food_id, fodmap_subtype_id, source_id, serving_g, valid_from)
);

CREATE TABLE food_fodmap_rollups (
  food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  serving_g NUMERIC(8,2) NOT NULL CHECK (serving_g > 0),
  overall_level fodmap_level NOT NULL,
  driver_fodmap_subtype_id SMALLINT REFERENCES fodmap_subtypes (fodmap_subtype_id),
  source_id UUID NOT NULL REFERENCES sources (source_id),
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (food_id, serving_g, source_id, computed_at)
);

CREATE TABLE culinary_roles (
  role_code TEXT PRIMARY KEY,
  label_fr TEXT NOT NULL,
  label_en TEXT NOT NULL,
  description TEXT
);

CREATE TABLE flavor_notes (
  flavor_code TEXT PRIMARY KEY,
  label_fr TEXT NOT NULL,
  label_en TEXT NOT NULL
);

CREATE TABLE texture_traits (
  texture_code TEXT PRIMARY KEY,
  label_fr TEXT NOT NULL,
  label_en TEXT NOT NULL
);

CREATE TABLE cooking_behaviors (
  behavior_code TEXT PRIMARY KEY,
  label_fr TEXT NOT NULL,
  label_en TEXT NOT NULL
);

CREATE TABLE cuisine_tags (
  cuisine_code TEXT PRIMARY KEY,
  label_fr TEXT NOT NULL,
  label_en TEXT NOT NULL
);

CREATE TABLE food_culinary_roles (
  food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  role_code TEXT NOT NULL REFERENCES culinary_roles (role_code),
  intensity SMALLINT NOT NULL DEFAULT 3 CHECK (intensity BETWEEN 1 AND 5),
  source_id UUID REFERENCES sources (source_id),
  PRIMARY KEY (food_id, role_code)
);

CREATE TABLE food_flavor_profiles (
  food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  flavor_code TEXT NOT NULL REFERENCES flavor_notes (flavor_code),
  intensity SMALLINT NOT NULL DEFAULT 3 CHECK (intensity BETWEEN 1 AND 5),
  source_id UUID REFERENCES sources (source_id),
  PRIMARY KEY (food_id, flavor_code)
);

CREATE TABLE food_texture_profiles (
  food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  texture_code TEXT NOT NULL REFERENCES texture_traits (texture_code),
  intensity SMALLINT NOT NULL DEFAULT 3 CHECK (intensity BETWEEN 1 AND 5),
  source_id UUID REFERENCES sources (source_id),
  PRIMARY KEY (food_id, texture_code)
);

CREATE TABLE food_cooking_behaviors (
  food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  behavior_code TEXT NOT NULL REFERENCES cooking_behaviors (behavior_code),
  source_id UUID REFERENCES sources (source_id),
  PRIMARY KEY (food_id, behavior_code)
);

CREATE TABLE food_cuisine_affinities (
  food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  cuisine_code TEXT NOT NULL REFERENCES cuisine_tags (cuisine_code),
  weight NUMERIC(4,3) CHECK (weight IS NULL OR (weight >= 0 AND weight <= 1)),
  source_id UUID REFERENCES sources (source_id),
  PRIMARY KEY (food_id, cuisine_code)
);

CREATE TABLE swap_rules (
  swap_rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_food_id UUID NOT NULL REFERENCES foods (food_id),
  to_food_id UUID NOT NULL REFERENCES foods (food_id),
  status swap_status NOT NULL DEFAULT 'draft',
  rule_kind TEXT NOT NULL CHECK (
    rule_kind IN ('direct_swap', 'technique_swap', 'pairing_swap', 'recipe_rewrite')
  ),
  instruction_fr TEXT NOT NULL,
  instruction_en TEXT,
  min_ratio NUMERIC(8,3) NOT NULL DEFAULT 0.50 CHECK (min_ratio > 0),
  max_ratio NUMERIC(8,3) NOT NULL DEFAULT 1.50 CHECK (max_ratio > 0),
  default_ratio NUMERIC(8,3) NOT NULL DEFAULT 1.00 CHECK (default_ratio > 0),
  source_id UUID REFERENCES sources (source_id),
  evidence_tier evidence_tier NOT NULL DEFAULT 'inferred',
  confidence_score NUMERIC(4,3) CHECK (
    confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)
  ),
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_to DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_swap_distinct_foods CHECK (from_food_id <> to_food_id),
  CONSTRAINT chk_swap_ratios CHECK (min_ratio <= default_ratio AND default_ratio <= max_ratio),
  UNIQUE (from_food_id, to_food_id, rule_kind, valid_from)
);

CREATE TABLE swap_rule_contexts (
  swap_rule_context_id BIGSERIAL PRIMARY KEY,
  swap_rule_id UUID NOT NULL REFERENCES swap_rules (swap_rule_id) ON DELETE CASCADE,
  cooking_methods TEXT[] NOT NULL DEFAULT '{}',
  dish_roles TEXT[] NOT NULL DEFAULT '{}',
  cuisine_codes TEXT[] NOT NULL DEFAULT '{}',
  excluded_food_ids UUID[] NOT NULL DEFAULT '{}',
  locale_country CHAR(2) NOT NULL DEFAULT 'FR',
  season_months SMALLINT[] NOT NULL DEFAULT '{}',
  notes TEXT
);

CREATE TABLE swap_rule_scores (
  swap_rule_id UUID PRIMARY KEY REFERENCES swap_rules (swap_rule_id) ON DELETE CASCADE,
  scoring_version TEXT NOT NULL DEFAULT 'v1',
  fodmap_safety_score NUMERIC(4,3) NOT NULL CHECK (fodmap_safety_score >= 0 AND fodmap_safety_score <= 1),
  flavor_match_score NUMERIC(4,3) NOT NULL CHECK (flavor_match_score >= 0 AND flavor_match_score <= 1),
  texture_match_score NUMERIC(4,3) NOT NULL CHECK (texture_match_score >= 0 AND texture_match_score <= 1),
  method_match_score NUMERIC(4,3) NOT NULL CHECK (method_match_score >= 0 AND method_match_score <= 1),
  availability_fr_score NUMERIC(4,3) NOT NULL CHECK (availability_fr_score >= 0 AND availability_fr_score <= 1),
  cost_fr_score NUMERIC(4,3) NOT NULL CHECK (cost_fr_score >= 0 AND cost_fr_score <= 1),
  overall_score NUMERIC(4,3) GENERATED ALWAYS AS (
    ROUND(
      (
        fodmap_safety_score * 0.50
        + flavor_match_score * 0.20
        + texture_match_score * 0.10
        + method_match_score * 0.10
        + availability_fr_score * 0.07
        + cost_fr_score * 0.03
      )::NUMERIC,
      3
    )
  ) STORED
);

CREATE TABLE eu_allergens (
  allergen_code TEXT PRIMARY KEY,
  annex_ii_name_en TEXT NOT NULL,
  annex_ii_name_fr TEXT NOT NULL,
  annex_ii_order SMALLINT NOT NULL UNIQUE
);

CREATE TABLE food_allergens (
  food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  allergen_code TEXT NOT NULL REFERENCES eu_allergens (allergen_code),
  presence_status TEXT NOT NULL CHECK (presence_status IN ('contains', 'may_contain', 'unknown')),
  source_id UUID REFERENCES sources (source_id),
  PRIMARY KEY (food_id, allergen_code, source_id)
);

CREATE TABLE products (
  product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gtin13 TEXT UNIQUE,
  open_food_facts_code TEXT UNIQUE,
  product_name_fr TEXT NOT NULL,
  brand TEXT,
  countries_tags TEXT[] NOT NULL DEFAULT '{}',
  ingredients_text_fr TEXT,
  serving_size_text TEXT,
  serving_quantity_g NUMERIC(8,2),
  nutriscore_grade CHAR(1) CHECK (nutriscore_grade IN ('a', 'b', 'c', 'd', 'e')),
  nova_group SMALLINT CHECK (nova_group BETWEEN 1 AND 4),
  source_id UUID REFERENCES sources (source_id),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_food_links (
  product_id UUID NOT NULL REFERENCES products (product_id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  link_method TEXT NOT NULL CHECK (link_method IN ('exact_name', 'manual', 'nlp')),
  link_confidence NUMERIC(4,3) NOT NULL CHECK (link_confidence >= 0 AND link_confidence <= 1),
  PRIMARY KEY (product_id, food_id)
);

CREATE TABLE product_allergens (
  product_id UUID NOT NULL REFERENCES products (product_id) ON DELETE CASCADE,
  allergen_code TEXT NOT NULL REFERENCES eu_allergens (allergen_code),
  presence_status TEXT NOT NULL CHECK (presence_status IN ('contains', 'may_contain', 'unknown')),
  source_id UUID REFERENCES sources (source_id),
  PRIMARY KEY (product_id, allergen_code, source_id)
);

CREATE TABLE recipes (
  recipe_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_slug TEXT NOT NULL UNIQUE,
  title_fr TEXT NOT NULL,
  title_en TEXT,
  description_fr TEXT,
  description_en TEXT,
  servings NUMERIC(5,2),
  prep_minutes INTEGER CHECK (prep_minutes IS NULL OR prep_minutes >= 0),
  cook_minutes INTEGER CHECK (cook_minutes IS NULL OR cook_minutes >= 0),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  locale_country CHAR(2) NOT NULL DEFAULT 'FR',
  source_id UUID REFERENCES sources (source_id),
  source_recipe_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recipe_ingredients (
  recipe_id UUID NOT NULL REFERENCES recipes (recipe_id) ON DELETE CASCADE,
  line_no SMALLINT NOT NULL,
  food_id UUID REFERENCES foods (food_id),
  ingredient_text_fr TEXT NOT NULL,
  ingredient_text_en TEXT,
  amount NUMERIC(12,4),
  unit TEXT,
  amount_g NUMERIC(12,4),
  preparation_note TEXT,
  is_optional BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (recipe_id, line_no)
);

CREATE TABLE recipe_steps (
  recipe_id UUID NOT NULL REFERENCES recipes (recipe_id) ON DELETE CASCADE,
  step_no SMALLINT NOT NULL,
  instruction_fr TEXT NOT NULL,
  instruction_en TEXT,
  PRIMARY KEY (recipe_id, step_no)
);

CREATE TABLE recipe_fodmap_assessments (
  recipe_fodmap_assessment_id BIGSERIAL PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES recipes (recipe_id) ON DELETE CASCADE,
  serving_g NUMERIC(8,2) NOT NULL CHECK (serving_g > 0),
  overall_level fodmap_level NOT NULL,
  limiting_subtypes TEXT[] NOT NULL DEFAULT '{}',
  source_id UUID NOT NULL REFERENCES sources (source_id),
  notes TEXT,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_profiles (
  user_profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_user_id TEXT UNIQUE,
  locale_code TEXT NOT NULL DEFAULT 'fr-FR',
  country_code CHAR(2) NOT NULL DEFAULT 'FR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_fodmap_tolerances (
  user_profile_id UUID NOT NULL REFERENCES user_profiles (user_profile_id) ON DELETE CASCADE,
  fodmap_subtype_id SMALLINT NOT NULL REFERENCES fodmap_subtypes (fodmap_subtype_id),
  tolerance tolerance_level NOT NULL DEFAULT 'unknown',
  max_tolerated_g NUMERIC(12,6),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_profile_id, fodmap_subtype_id)
);

CREATE INDEX idx_food_external_refs_system_value ON food_external_refs (ref_system, ref_value);
CREATE INDEX idx_nutrient_observations_food_nutrient ON food_nutrient_observations (food_id, nutrient_id);
CREATE INDEX idx_fodmap_measurements_food_subtype ON food_fodmap_measurements (food_id, fodmap_subtype_id);
CREATE INDEX idx_swap_rules_from_food ON swap_rules (from_food_id);
CREATE INDEX idx_swap_rules_to_food ON swap_rules (to_food_id);
CREATE INDEX idx_recipe_ingredients_food_id ON recipe_ingredients (food_id);
CREATE INDEX idx_products_off_code ON products (open_food_facts_code);
CREATE INDEX idx_food_names_locale_name ON food_names (locale_code, name);
CREATE INDEX idx_food_fr_contexts_availability ON food_fr_contexts (availability);

/*
Comparator policy for excess fructose derivation:
- derive only when fructose and glucose observations are both numeric-comparable
  (comparator in 'eq', 'lt', 'lte' and amount_value is not NULL)
- otherwise excess_fructose_g_per_100g is NULL and derivation_status explains why
*/
CREATE VIEW v_food_excess_fructose_measurements AS
WITH fructose_candidates AS (
  SELECT
    fno.observation_id,
    fno.food_id,
    fno.source_id,
    fno.comparator,
    fno.amount_value,
    COALESCE(fno.observed_at, fno.effective_from) AS observed_on,
    ROW_NUMBER() OVER (
      PARTITION BY fno.food_id, fno.source_id
      ORDER BY COALESCE(fno.observed_at, fno.effective_from) DESC, fno.created_at DESC, fno.observation_id DESC
    ) AS rn
  FROM food_nutrient_observations AS fno
  JOIN nutrient_definitions AS nd
    ON nd.nutrient_id = fno.nutrient_id
  WHERE fno.basis = 'per_100g'
    AND (nd.infoods_code = 'FRUS' OR nd.nutrient_code = 'CIQUAL_32210')
),
glucose_candidates AS (
  SELECT
    fno.observation_id,
    fno.food_id,
    fno.source_id,
    fno.comparator,
    fno.amount_value,
    COALESCE(fno.observed_at, fno.effective_from) AS observed_on,
    ROW_NUMBER() OVER (
      PARTITION BY fno.food_id, fno.source_id
      ORDER BY COALESCE(fno.observed_at, fno.effective_from) DESC, fno.created_at DESC, fno.observation_id DESC
    ) AS rn
  FROM food_nutrient_observations AS fno
  JOIN nutrient_definitions AS nd
    ON nd.nutrient_id = fno.nutrient_id
  WHERE fno.basis = 'per_100g'
    AND (nd.infoods_code = 'GLUS' OR nd.nutrient_code = 'CIQUAL_32250')
),
fructose_latest AS (
  SELECT * FROM fructose_candidates WHERE rn = 1
),
glucose_latest AS (
  SELECT * FROM glucose_candidates WHERE rn = 1
)
SELECT
  COALESCE(fl.food_id, gl.food_id) AS food_id,
  COALESCE(fl.source_id, gl.source_id) AS source_id,
  s.source_slug,
  fl.observation_id AS fructose_observation_id,
  gl.observation_id AS glucose_observation_id,
  fl.comparator AS fructose_comparator,
  gl.comparator AS glucose_comparator,
  fl.amount_value AS fructose_g_per_100g,
  gl.amount_value AS glucose_g_per_100g,
  CASE
    WHEN fl.observation_id IS NULL OR gl.observation_id IS NULL THEN NULL
    WHEN fl.comparator NOT IN ('eq', 'lt', 'lte') OR gl.comparator NOT IN ('eq', 'lt', 'lte') THEN NULL
    WHEN fl.amount_value IS NULL OR gl.amount_value IS NULL THEN NULL
    ELSE GREATEST(fl.amount_value - gl.amount_value, 0)
  END AS excess_fructose_g_per_100g,
  CASE
    WHEN fl.observation_id IS NULL OR gl.observation_id IS NULL THEN 'missing_value'
    WHEN fl.comparator NOT IN ('eq', 'lt', 'lte') OR gl.comparator NOT IN ('eq', 'lt', 'lte') THEN 'non_comparable_comparator'
    WHEN fl.amount_value IS NULL OR gl.amount_value IS NULL THEN 'missing_value'
    ELSE 'computed'
  END AS derivation_status,
  GREATEST(
    COALESCE(fl.observed_on, DATE '1900-01-01'),
    COALESCE(gl.observed_on, DATE '1900-01-01')
  ) AS observed_on
FROM fructose_latest AS fl
FULL OUTER JOIN glucose_latest AS gl
  ON fl.food_id = gl.food_id
 AND fl.source_id = gl.source_id
JOIN sources AS s
  ON s.source_id = COALESCE(fl.source_id, gl.source_id);

CREATE VIEW v_food_excess_fructose_latest AS
SELECT DISTINCT ON (food_id)
  food_id,
  source_id,
  source_slug,
  fructose_observation_id,
  glucose_observation_id,
  fructose_comparator,
  glucose_comparator,
  fructose_g_per_100g,
  glucose_g_per_100g,
  excess_fructose_g_per_100g,
  derivation_status,
  observed_on
FROM v_food_excess_fructose_measurements
ORDER BY
  food_id,
  (derivation_status = 'computed') DESC,
  observed_on DESC NULLS LAST,
  source_slug;

COMMENT ON VIEW v_food_excess_fructose_measurements IS
'Computes excess fructose as GREATEST(fructose - glucose, 0) when both inputs are numeric-comparable (eq/lt/lte). Otherwise excess is NULL with derivation_status.';

COMMENT ON VIEW v_food_excess_fructose_latest IS
'Best current excess-fructose estimate per food; prefers computable rows, then most recent observation.';

INSERT INTO data_licenses (spdx_id, name, url, notes) VALUES
  ('etalab-2.0', 'Etalab Open Licence 2.0', 'https://spdx.org/licenses/etalab-2.0.html', 'French public-sector open data license used by CIQUAL.'),
  ('ODbL-1.0', 'Open Database License 1.0', 'https://opendatacommons.org/licenses/odbl/1-0/', 'Open Food Facts database license.'),
  ('LicenseRef-Proprietary', 'Proprietary commercial license', 'https://example.invalid/proprietary', 'Placeholder for commercial providers such as Monash/FODMAP Friendly.'),
  ('LicenseRef-Internal', 'Internal editorial license', 'https://example.invalid/internal', 'Internal expert-reviewed rules and curation.');

INSERT INTO sources (
  source_slug,
  source_name,
  source_kind,
  organization,
  country_code,
  citation,
  url,
  dataset_version,
  published_at,
  trust_tier,
  is_commercial,
  license_id
) VALUES
  (
    'ciqual_2025',
    'ANSES CIQUAL 2025',
    'official_database',
    'ANSES',
    'FR',
    'Anses. 2025. Table de composition nutritionnelle des aliments Ciqual 2025.',
    'https://entrepot.recherche.data.gouv.fr/dataset.xhtml?persistentId=doi:10.57745/RDMHWY',
    '2025-11-03',
    DATE '2025-11-19',
    'secondary_db',
    FALSE,
    (SELECT license_id FROM data_licenses WHERE spdx_id = 'etalab-2.0')
  ),
  (
    'open_food_facts',
    'Open Food Facts',
    'community',
    'Open Food Facts',
    'FR',
    'Open Food Facts collaborative product database.',
    'https://world.openfoodfacts.org/data',
    'rolling',
    NULL,
    'secondary_db',
    FALSE,
    (SELECT license_id FROM data_licenses WHERE spdx_id = 'ODbL-1.0')
  ),
  (
    'monash_app_manual',
    'Monash FODMAP App (manual extraction)',
    'app_vendor',
    'Monash University',
    'AU',
    'Manual reference extraction from Monash Low FODMAP App.',
    'https://www.monashfodmap.com/blog/app-how-to/',
    'v4.x',
    NULL,
    'primary_lab',
    TRUE,
    (SELECT license_id FROM data_licenses WHERE spdx_id = 'LicenseRef-Proprietary')
  ),
  (
    'expert_dietitian_panel',
    'Internal Expert Dietitian Panel',
    'internal',
    'FODMAP Planner',
    'FR',
    'Editorial culinary and substitution review by dietitian panel.',
    NULL,
    'v1',
    NULL,
    'secondary_db',
    FALSE,
    (SELECT license_id FROM data_licenses WHERE spdx_id = 'LicenseRef-Internal')
  ),
  (
    'internal_rules_v1',
    'Internal Swap Rules v1',
    'internal',
    'FODMAP Planner',
    'FR',
    'Rules-based substitutions tuned for French market.',
    NULL,
    'v1',
    NULL,
    'inferred',
    FALSE,
    (SELECT license_id FROM data_licenses WHERE spdx_id = 'LicenseRef-Internal')
  ),
  (
    'muir_2007_fructan',
    'Muir 2007 fructan reference',
    'research_paper',
    'Monash University',
    'AU',
    'Muir et al. 2007. Reference fructan composition values for foods relevant to low-FODMAP protocols.',
    NULL,
    '2007',
    NULL,
    'primary_lab',
    FALSE,
    (SELECT license_id FROM data_licenses WHERE spdx_id = 'LicenseRef-Internal')
  ),
  (
    'biesiekierski_2011_fructan',
    'Biesiekierski 2011 fructan reference',
    'research_paper',
    'Monash University',
    'AU',
    'Biesiekierski et al. 2011. Fructan-focused evidence used for IBS/FODMAP assessment.',
    NULL,
    '2011',
    NULL,
    'primary_lab',
    FALSE,
    (SELECT license_id FROM data_licenses WHERE spdx_id = 'LicenseRef-Internal')
  ),
  (
    'dysseler_hoffem_gos',
    'Dysseler and Hoffem GOS reference',
    'research_paper',
    'Literature extraction',
    NULL,
    'Dysseler and Hoffem. GOS composition evidence used for legumes, pulses, and nuts.',
    NULL,
    'v1',
    NULL,
    'primary_lab',
    FALSE,
    (SELECT license_id FROM data_licenses WHERE spdx_id = 'LicenseRef-Internal')
  ),
  (
    'yao_2005_polyols',
    'Yao 2005 polyol split reference',
    'research_paper',
    'Monash University',
    'AU',
    'Yao et al. 2005. Sorbitol and mannitol composition values used for polyol split curation.',
    NULL,
    '2005',
    NULL,
    'primary_lab',
    FALSE,
    (SELECT license_id FROM data_licenses WHERE spdx_id = 'LicenseRef-Internal')
  ),
  (
    'monash_app_v4_reference',
    'Monash FODMAP App v4 reference',
    'app_vendor',
    'Monash University',
    'AU',
    'Monash Low FODMAP App v4 serving-based ratings and tolerability references.',
    'https://www.monashfodmap.com/blog/app-how-to/',
    'v4',
    NULL,
    'primary_lab',
    TRUE,
    (SELECT license_id FROM data_licenses WHERE spdx_id = 'LicenseRef-Proprietary')
  );

INSERT INTO safe_harbor_cohorts (
  cohort_code,
  label_fr,
  label_en,
  rationale_fr,
  rationale_en,
  caveat_fr,
  caveat_en,
  sort_order
) VALUES
  (
    'cohort_oil_fat',
    'Matières grasses simples',
    'Simple fats and oils',
    'Aliments retenus quand les données CIQUAL et les règles internes indiquent une matrice très pauvre en glucides fermentescibles.',
    'Included when CIQUAL data and internal rules indicate a matrix that is very low in fermentable carbohydrate.',
    'Formes simples uniquement. Les marinades, sauces et ajouts aromatiques peuvent changer la compatibilité. Pour une huile infusée maison, conserver au réfrigérateur et jeter après 4 jours.',
    'Plain forms only. Marinades, sauces, and aromatic additions can change compatibility. For homemade infused oils, refrigerate and discard after 4 days.',
    1
  ),
  (
    'cohort_plain_protein',
    'Protéines animales simples',
    'Simple animal proteins',
    'Aliments retenus quand les données CIQUAL et les règles internes indiquent une base animale simple, sans ingrédients riches en glucides fermentescibles ajoutés.',
    'Included when CIQUAL data and internal rules indicate a simple animal-food base without added fermentable-carbohydrate ingredients.',
    'Formes nature uniquement. La panure, les sauces, les marinades, la salaison et les assaisonnements peuvent changer la compatibilité.',
    'Plain forms only. Breading, sauces, marinades, curing, and seasoning can change compatibility.',
    2
  ),
  (
    'cohort_egg',
    'Œufs simples',
    'Simple eggs',
    'Aliments retenus quand les données CIQUAL et les règles internes indiquent des œufs ou parties d''œufs sans garniture complexe.',
    'Included when CIQUAL data and internal rules indicate eggs or egg components without complex added fillings.',
    'Formes simples uniquement. Les omelettes garnies, poudres composées et préparations avec ajout d''oignon, d''ail ou de sauce ne sont pas incluses.',
    'Plain forms only. Filled omelets, compound powders, and preparations with added onion, garlic, or sauces are not included.',
    3
  )
ON CONFLICT (cohort_code) DO UPDATE SET
  label_fr = EXCLUDED.label_fr,
  label_en = EXCLUDED.label_en,
  rationale_fr = EXCLUDED.rationale_fr,
  rationale_en = EXCLUDED.rationale_en,
  caveat_fr = EXCLUDED.caveat_fr,
  caveat_en = EXCLUDED.caveat_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO food_categories (code, parent_category_id, name_fr, name_en, level, source_system) VALUES
  ('proteines', NULL, 'Protéines', 'Proteins', 1, 'fr_market_v1'),
  ('legumes_et_verdures', NULL, 'Légumes et verdures', 'Vegetables and greens', 1, 'fr_market_v1'),
  ('fruits', NULL, 'Fruits', 'Fruits', 1, 'fr_market_v1'),
  ('cereales_et_feculents', NULL, 'Céréales et féculents', 'Grains and starches', 1, 'fr_market_v1'),
  ('produits_laitiers', NULL, 'Produits laitiers', 'Dairy products', 1, 'fr_market_v1'),
  ('alternatives_laitieres', NULL, 'Alternatives laitières', 'Dairy alternatives', 1, 'fr_market_v1'),
  ('matieres_grasses', NULL, 'Matières grasses', 'Fats and oils', 1, 'fr_market_v1'),
  ('herbes_et_epices', NULL, 'Herbes et épices', 'Herbs and spices', 1, 'fr_market_v1'),
  ('condiments_et_sauces', NULL, 'Condiments et sauces', 'Condiments and sauces', 1, 'fr_market_v1'),
  ('noix_et_graines', NULL, 'Noix et graines', 'Nuts and seeds', 1, 'fr_market_v1'),
  ('legumineuses', NULL, 'Légumineuses', 'Legumes and pulses', 1, 'fr_market_v1'),
  ('boissons', NULL, 'Boissons', 'Beverages', 1, 'fr_market_v1'),
  ('sucres_et_edulcorants', NULL, 'Sucres et édulcorants', 'Sugars and sweeteners', 1, 'fr_market_v1'),
  ('boulangerie_et_patisserie', NULL, 'Boulangerie et pâtisserie', 'Bakery and pastry', 1, 'fr_market_v1'),
  ('charcuterie', NULL, 'Charcuterie', 'Cured and deli meats', 1, 'fr_market_v1');

INSERT INTO culinary_roles (role_code, label_fr, label_en, description) VALUES
  ('proteine_principale', 'Protéine principale', 'Main protein', 'Primary protein component in the dish.'),
  ('feculent_base', 'Féculent de base', 'Base starch', 'Primary starch or carbohydrate foundation.'),
  ('legume_principal', 'Légume principal', 'Main vegetable', 'Primary vegetable component.'),
  ('base_aromatique', 'Base aromatique', 'Aromatic base', 'Aromatic foundation for sauces or sautéing.'),
  ('assaisonnement', 'Assaisonnement', 'Seasoning', 'Flavoring or spice layer.'),
  ('herbe_fraiche', 'Herbe fraîche', 'Fresh herb', 'Fresh herb used for aroma or garnish.'),
  ('matiere_grasse_cuisson', 'Matière grasse de cuisson', 'Cooking fat', 'Fat used for cooking.'),
  ('acide', 'Acide', 'Acid', 'Sour/acidic balancing ingredient.'),
  ('liant', 'Liant', 'Binder', 'Ingredient used to bind or thicken.'),
  ('sucrant', 'Sucrant', 'Sweetener', 'Ingredient used to sweeten.'),
  ('garniture', 'Garniture', 'Garnish', 'Finishing garnish.'),
  ('sauce_base', 'Base de sauce', 'Sauce base', 'Liquid or sauce foundation.'),
  ('condiment', 'Condiment', 'Condiment', 'Concentrated flavor accompaniment.'),
  ('produit_laitier_texture', 'Produit laitier texture', 'Dairy texture', 'Dairy ingredient used for creaminess/texture.');

INSERT INTO flavor_notes (flavor_code, label_fr, label_en) VALUES
  ('piquant', 'Piquant', 'Pungent'),
  ('doux', 'Doux', 'Mild'),
  ('umami', 'Umami', 'Umami'),
  ('amer', 'Amer', 'Bitter'),
  ('acide', 'Acide', 'Acidic'),
  ('sucre', 'Sucré', 'Sweet'),
  ('sale', 'Salé', 'Salty'),
  ('soufre', 'Soufré', 'Sulphurous'),
  ('terreux', 'Terreux', 'Earthy'),
  ('herbace', 'Herbacé', 'Herbaceous'),
  ('floral', 'Floral', 'Floral'),
  ('fume', 'Fumé', 'Smoky'),
  ('anise', 'Anisé', 'Anise'),
  ('menthole', 'Mentholé', 'Menthol'),
  ('neutre', 'Neutre', 'Neutral'),
  ('caramelise', 'Caramélisé', 'Caramelized');

INSERT INTO texture_traits (texture_code, label_fr, label_en) VALUES
  ('ferme', 'Ferme', 'Firm'),
  ('croquant', 'Croquant', 'Crunchy'),
  ('tendre', 'Tendre', 'Tender'),
  ('mou', 'Mou', 'Soft'),
  ('juteux', 'Juteux', 'Juicy'),
  ('fibreux', 'Fibreux', 'Fibrous'),
  ('granuleux', 'Granuleux', 'Grainy'),
  ('lisse', 'Lisse', 'Smooth'),
  ('collant', 'Collant', 'Sticky'),
  ('sec', 'Sec', 'Dry'),
  ('liquide', 'Liquide', 'Liquid'),
  ('cremeux', 'Crémeux', 'Creamy'),
  ('fondant', 'Fondant', 'Melting'),
  ('confit', 'Confit', 'Confit'),
  ('croquant_cuisson', 'Croquant à la cuisson', 'Keeps crunch when cooked');

INSERT INTO cooking_behaviors (behavior_code, label_fr, label_en) VALUES
  ('caramelise', 'Caramélise', 'Caramelizes'),
  ('infuse_dans_huile', 'Infuse dans l''huile', 'Infuses in oil'),
  ('se_defait', 'Se défait', 'Breaks down'),
  ('epaissit', 'Épaissit', 'Thickens'),
  ('brule_facilement', 'Brûle facilement', 'Burns easily'),
  ('cru_ok', 'Utilisable cru', 'Can be used raw'),
  ('cuisson_longue', 'Cuisson longue', 'Long cooking suited'),
  ('cuisson_rapide', 'Cuisson rapide', 'Quick cooking suited'),
  ('fond', 'Fond', 'Melts'),
  ('reduit', 'Réduit', 'Reduces');

INSERT INTO cuisine_tags (cuisine_code, label_fr, label_en) VALUES
  ('francaise', 'Française', 'French'),
  ('mediterraneenne', 'Méditerranéenne', 'Mediterranean'),
  ('asiatique', 'Asiatique', 'Asian'),
  ('mexicaine', 'Mexicaine', 'Mexican'),
  ('indienne', 'Indienne', 'Indian'),
  ('nord_africaine', 'Nord-africaine', 'North African'),
  ('italienne', 'Italienne', 'Italian'),
  ('americaine', 'Américaine', 'American'),
  ('japonaise', 'Japonaise', 'Japanese'),
  ('autre', 'Autre', 'Other');

INSERT INTO fodmap_subtypes (code, family, display_name_fr, display_name_en, is_polyol) VALUES
  ('fructose', 'monosaccharide', 'Fructose', 'Fructose', FALSE),
  ('lactose', 'disaccharide', 'Lactose', 'Lactose', FALSE),
  ('fructan', 'oligosaccharide', 'Fructanes', 'Fructans', FALSE),
  ('gos', 'oligosaccharide', 'GOS', 'GOS', FALSE),
  ('sorbitol', 'polyol', 'Sorbitol', 'Sorbitol', TRUE),
  ('mannitol', 'polyol', 'Mannitol', 'Mannitol', TRUE);

INSERT INTO phase2_priority_foods (
  priority_rank,
  gap_bucket,
  target_subtype,
  food_label,
  variant_label,
  ciqual_code_hint,
  food_slug_hint,
  resolved_food_id,
  resolution_method,
  resolution_notes,
  serving_g_provisional,
  source_strategy,
  status,
  resolved_at,
  resolved_by
) VALUES
  (1, 'fructan_dominant', 'fructan', 'ail', 'raw cloves', '11000', 'ail_cru', NULL, NULL, NULL, 3.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (2, 'fructan_dominant', 'fructan', 'ail', 'powder', NULL, 'ail_poudre', NULL, NULL, NULL, 1.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (3, 'fructan_dominant', 'fructan', 'ail', 'infused oil', NULL, 'huile_infusee_ail', NULL, NULL, NULL, 14.00, 'muir_2007_fructan|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (4, 'fructan_dominant', 'fructan', 'oignon', 'raw bulb', NULL, 'oignon_cru', NULL, NULL, NULL, 40.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (5, 'fructan_dominant', 'fructan', 'oignon', 'cooked bulb', NULL, 'oignon_cuit', NULL, NULL, NULL, 60.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (6, 'fructan_dominant', 'fructan', 'oignon', 'powder', NULL, 'oignon_poudre', NULL, NULL, NULL, 2.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (7, 'fructan_dominant', 'fructan', 'oignon nouveau', 'white bulb', NULL, 'cebette_blanc', NULL, NULL, NULL, 15.00, 'muir_2007_fructan|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (8, 'fructan_dominant', 'fructan', 'oignon nouveau', 'green tops', NULL, 'cebette_vert', NULL, NULL, NULL, 30.00, 'muir_2007_fructan|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (9, 'fructan_dominant', 'fructan', 'echalote', 'raw bulb', NULL, 'echalote_crue', NULL, NULL, NULL, 20.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (10, 'fructan_dominant', 'fructan', 'poireau', 'white part', NULL, 'poireau_blanc', NULL, NULL, NULL, 40.00, 'muir_2007_fructan|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (11, 'fructan_dominant', 'fructan', 'farine de ble', 'Type T55', NULL, 'farine_ble_t55', NULL, NULL, NULL, 40.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (12, 'fructan_dominant', 'fructan', 'farine de ble', 'Type T65', NULL, 'farine_ble_t65', NULL, NULL, NULL, 40.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (13, 'fructan_dominant', 'fructan', 'farine de ble', 'Type T80', NULL, 'farine_ble_t80', NULL, NULL, NULL, 40.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (14, 'fructan_dominant', 'fructan', 'seigle', 'grain or flour', NULL, 'seigle', NULL, NULL, NULL, 40.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (15, 'fructan_dominant', 'fructan', 'orge', 'pearled barley', NULL, 'orge_perle', NULL, NULL, NULL, 75.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (16, 'fructan_dominant', 'fructan', 'artichaut', 'globe heart', NULL, 'artichaut', NULL, NULL, NULL, 75.00, 'muir_2007_fructan|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (17, 'fructan_dominant', 'fructan', 'racine de chicoree', 'root', NULL, 'racine_chicoree', NULL, NULL, NULL, 30.00, 'muir_2007_fructan|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (18, 'gos_dominant', 'gos', 'pois chiche', 'canned drained', NULL, 'pois_chiche_conserve', NULL, NULL, NULL, 75.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (19, 'gos_dominant', 'gos', 'lentille', 'green cooked', NULL, 'lentille_verte_cuite', NULL, NULL, NULL, 100.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (20, 'gos_dominant', 'gos', 'lentille', 'red cooked', NULL, 'lentille_rouge_cuite', NULL, NULL, NULL, 100.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (21, 'gos_dominant', 'gos', 'lentille', 'brown cooked', NULL, 'lentille_brune_cuite', NULL, NULL, NULL, 100.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (22, 'gos_dominant', 'gos', 'haricot blanc', 'cooked', NULL, 'haricot_blanc_cuit', NULL, NULL, NULL, 90.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (23, 'gos_dominant', 'gos', 'haricot rouge', 'cooked kidney bean', NULL, 'haricot_rouge_cuit', NULL, NULL, NULL, 90.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (24, 'gos_dominant', 'gos', 'haricot noir', 'cooked', NULL, 'haricot_noir_cuit', NULL, NULL, NULL, 90.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (25, 'gos_dominant', 'gos', 'pois casse', 'cooked', NULL, 'pois_casse_cuit', NULL, NULL, NULL, 90.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (26, 'gos_dominant', 'gos', 'edamame', 'cooked', NULL, 'edamame_cuit', NULL, NULL, NULL, 75.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (27, 'gos_dominant', 'gos', 'soja', 'whole cooked', NULL, 'soja_cuit', NULL, NULL, NULL, 75.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (28, 'gos_dominant', 'gos', 'noix de cajou', 'raw', NULL, 'cajou_cru', NULL, NULL, NULL, 30.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (29, 'gos_dominant', 'gos', 'pistache', 'raw', NULL, 'pistache_crue', NULL, NULL, NULL, 30.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (30, 'polyol_split_needed', 'sorbitol', 'pomme', 'raw', NULL, 'pomme_crue', NULL, NULL, NULL, 125.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (31, 'polyol_split_needed', 'sorbitol', 'poire', 'raw', NULL, 'poire_crue', NULL, NULL, NULL, 120.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (32, 'polyol_split_needed', 'sorbitol', 'cerise', 'sweet raw', NULL, 'cerise_crue', NULL, NULL, NULL, 80.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (33, 'polyol_split_needed', 'sorbitol', 'peche', 'raw', NULL, 'peche_crue', NULL, NULL, NULL, 120.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (34, 'polyol_split_needed', 'sorbitol', 'nectarine', 'raw', NULL, 'nectarine_crue', NULL, NULL, NULL, 120.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (35, 'polyol_split_needed', 'sorbitol', 'prune', 'raw', NULL, 'prune_crue', NULL, NULL, NULL, 120.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (36, 'polyol_split_needed', 'sorbitol', 'pruneau', 'dried', NULL, 'pruneau_sec', NULL, NULL, NULL, 30.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (37, 'polyol_split_needed', 'mannitol', 'champignon de paris', 'button mushroom', NULL, 'champignon_paris', NULL, NULL, NULL, 75.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (38, 'polyol_split_needed', 'mannitol', 'shiitake', 'mushroom', NULL, 'shiitake', NULL, NULL, NULL, 60.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (39, 'polyol_split_needed', 'mannitol', 'pleurote', 'oyster mushroom', NULL, 'pleurote', NULL, NULL, NULL, 75.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (40, 'polyol_split_needed', 'mannitol', 'chou-fleur', 'florets', NULL, 'chou_fleur', NULL, NULL, NULL, 90.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (41, 'polyol_split_needed', 'mannitol', 'patate douce', 'cooked', NULL, 'patate_douce_cuite', NULL, NULL, NULL, 90.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', NULL, NULL),
  (42, 'polyol_split_needed', 'mannitol', 'celeri', 'stalk', NULL, 'celeri_branche', NULL, NULL, NULL, 75.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', NULL, NULL);

/*
UTF-8 expected for French regulatory labels.
Keep Annex II names with proper French diacritics in database and API outputs.
*/
INSERT INTO eu_allergens (allergen_code, annex_ii_name_en, annex_ii_name_fr, annex_ii_order) VALUES
  ('gluten_cereals', 'Cereals containing gluten', 'Céréales contenant du gluten', 1),
  ('crustaceans', 'Crustaceans', 'Crustacés', 2),
  ('eggs', 'Eggs', 'Œufs', 3),
  ('fish', 'Fish', 'Poissons', 4),
  ('peanuts', 'Peanuts', 'Arachides', 5),
  ('soybeans', 'Soybeans', 'Soja', 6),
  ('milk', 'Milk', 'Lait', 7),
  ('nuts', 'Nuts', 'Fruits à coque', 8),
  ('celery', 'Celery', 'Céleri', 9),
  ('mustard', 'Mustard', 'Moutarde', 10),
  ('sesame', 'Sesame seeds', 'Graines de sésame', 11),
  ('sulphites', 'Sulphur dioxide and sulphites', 'Anhydride sulfureux et sulfites', 12),
  ('lupin', 'Lupin', 'Lupin', 13),
  ('molluscs', 'Molluscs', 'Mollusques', 14);

INSERT INTO nutrient_definitions (nutrient_code, infoods_code, name_fr, name_en, unit, default_basis, is_fodmap_relevant, notes) VALUES
  ('CIQUAL_32210', 'FRUS', 'Fructose', 'Fructose', 'g', 'per_100g', TRUE, 'Ciqual const_code 32210'),
  ('CIQUAL_32220', 'GALS', 'Galactose (g/100 g)', 'Galactose (g/100g)', 'g/100g', 'per_100g', FALSE, 'Ciqual const_code 32220'),
  ('CIQUAL_32410', 'LACS', 'Lactose', 'Lactose', 'g', 'per_100g', TRUE, 'Ciqual const_code 32410'),
  ('CIQUAL_34000', 'POLYL', 'Polyols totaux', 'Total polyols', 'g', 'per_100g', TRUE, 'Proxy only. Do not map directly to sorbitol+mannitol without assumptions.'),
  ('CIQUAL_32250', 'GLUS', 'Glucose', 'Glucose', 'g', 'per_100g', FALSE, 'Useful for fructose excess heuristics.'),
  ('CIQUAL_32000', 'SUGAR', 'Sucres', 'Sugars', 'g', 'per_100g', FALSE, 'Macronutrient context');

COMMIT;
