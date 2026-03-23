-- migrate:up

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_name_en TEXT,
  ADD COLUMN IF NOT EXISTS categories_tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE product_food_links
  DROP CONSTRAINT IF EXISTS product_food_links_link_method_check;

ALTER TABLE product_food_links
  ADD CONSTRAINT product_food_links_link_method_check
  CHECK (link_method = ANY (ARRAY['exact_name'::text, 'manual'::text, 'nlp'::text, 'heuristic'::text]));

CREATE TABLE IF NOT EXISTS product_codes (
  normalized_code TEXT PRIMARY KEY CHECK (
    normalized_code ~ '^[0-9]{8}$'
    OR normalized_code ~ '^[0-9]{13}$'
  ),
  product_id UUID NOT NULL REFERENCES products (product_id) ON DELETE CASCADE,
  canonical_format TEXT NOT NULL CHECK (canonical_format IN ('EAN8', 'EAN13')),
  source_code TEXT NOT NULL,
  provider_source_id UUID NOT NULL REFERENCES sources (source_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, canonical_format, source_code)
);

CREATE TABLE IF NOT EXISTS product_provider_snapshots (
  product_provider_snapshot_id BIGSERIAL PRIMARY KEY,
  normalized_code TEXT NOT NULL CHECK (
    normalized_code ~ '^[0-9]{8}$'
    OR normalized_code ~ '^[0-9]{13}$'
  ),
  product_id UUID REFERENCES products (product_id) ON DELETE SET NULL,
  canonical_format TEXT NOT NULL CHECK (canonical_format IN ('EAN8', 'EAN13')),
  provider_source_id UUID NOT NULL REFERENCES sources (source_id),
  fetch_status TEXT NOT NULL CHECK (fetch_status IN ('found', 'not_found', 'error')),
  provider_payload JSONB,
  source_code TEXT,
  product_name_fr TEXT,
  product_name_en TEXT,
  brand TEXT,
  ingredients_text_fr TEXT,
  categories_tags TEXT[] NOT NULL DEFAULT '{}',
  countries_tags TEXT[] NOT NULL DEFAULT '{}',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_refresh_requests (
  normalized_code TEXT PRIMARY KEY CHECK (
    normalized_code ~ '^[0-9]{8}$'
    OR normalized_code ~ '^[0-9]{13}$'
  ),
  canonical_format TEXT NOT NULL CHECK (canonical_format IN ('EAN8', 'EAN13')),
  provider_source_id UUID NOT NULL REFERENCES sources (source_id),
  product_id UUID REFERENCES products (product_id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  refresh_after TIMESTAMPTZ NOT NULL DEFAULT now(),
  cooldown_until TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_processed_at TIMESTAMPTZ,
  last_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_ingredients (
  product_id UUID NOT NULL REFERENCES products (product_id) ON DELETE CASCADE,
  line_no SMALLINT NOT NULL CHECK (line_no >= 1),
  ingredient_text_fr TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  declared_share_pct NUMERIC(5,2) CHECK (
    declared_share_pct IS NULL OR (declared_share_pct >= 0 AND declared_share_pct <= 100)
  ),
  parser_version TEXT NOT NULL,
  parse_confidence NUMERIC(4,3) NOT NULL CHECK (parse_confidence >= 0 AND parse_confidence <= 1),
  is_substantive BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, line_no)
);

CREATE TABLE IF NOT EXISTS product_food_candidates (
  product_food_candidate_id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL,
  line_no SMALLINT NOT NULL,
  food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  candidate_rank SMALLINT NOT NULL CHECK (candidate_rank >= 1),
  match_method TEXT NOT NULL CHECK (
    match_method IN ('ingredient_name', 'product_name', 'category_overlap', 'heuristic')
  ),
  score NUMERIC(4,3) NOT NULL CHECK (score >= 0 AND score <= 1),
  confidence_tier TEXT NOT NULL CHECK (confidence_tier IN ('high', 'medium', 'low', 'insufficient')),
  signal_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  heuristic_version TEXT NOT NULL,
  is_selected BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, line_no, candidate_rank),
  UNIQUE (product_id, line_no, food_id, heuristic_version),
  FOREIGN KEY (product_id, line_no) REFERENCES product_ingredients (product_id, line_no) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_assessments (
  product_assessment_id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products (product_id) ON DELETE CASCADE,
  method_version TEXT NOT NULL,
  contract_tier TEXT NOT NULL CHECK (contract_tier = 'guided'),
  assessment_mode TEXT NOT NULL CHECK (assessment_mode = 'guided'),
  assessment_status TEXT NOT NULL CHECK (assessment_status IN ('ready', 'insufficient', 'failed')),
  confidence_tier TEXT NOT NULL CHECK (confidence_tier IN ('high', 'medium', 'low', 'insufficient')),
  heuristic_overall_level fodmap_level NOT NULL,
  heuristic_max_low_portion_g NUMERIC(8,2) CHECK (
    heuristic_max_low_portion_g IS NULL OR heuristic_max_low_portion_g > 0
  ),
  numeric_guidance_status TEXT NOT NULL CHECK (
    numeric_guidance_status IN (
      'available',
      'insufficient_confidence',
      'mixed_ingredients',
      'unknown_rollup',
      'not_enough_data'
    )
  ),
  numeric_guidance_basis TEXT CHECK (numeric_guidance_basis IN ('dominant_matched_food')),
  dominant_food_id UUID REFERENCES foods (food_id) ON DELETE SET NULL,
  dominant_ingredient_line_no SMALLINT,
  limiting_subtypes TEXT[] NOT NULL DEFAULT '{}',
  caveats TEXT[] NOT NULL DEFAULT '{}',
  provider_source_id UUID NOT NULL REFERENCES sources (source_id),
  provider_last_synced_at TIMESTAMPTZ,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, method_version),
  CHECK (
    (
      numeric_guidance_status = 'available'
      AND heuristic_max_low_portion_g IS NOT NULL
      AND numeric_guidance_basis IS NOT NULL
    )
    OR numeric_guidance_status <> 'available'
  )
);

CREATE TABLE IF NOT EXISTS product_assessment_subtypes (
  product_assessment_id BIGINT NOT NULL REFERENCES product_assessments (product_assessment_id) ON DELETE CASCADE,
  subtype_code TEXT NOT NULL REFERENCES fodmap_subtypes (code),
  subtype_level fodmap_level NOT NULL,
  source_food_id UUID REFERENCES foods (food_id) ON DELETE SET NULL,
  low_max_g NUMERIC(8,2) CHECK (low_max_g IS NULL OR low_max_g > 0),
  moderate_max_g NUMERIC(8,2) CHECK (moderate_max_g IS NULL OR moderate_max_g > 0),
  burden_ratio NUMERIC(12,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_assessment_id, subtype_code)
);

CREATE TABLE IF NOT EXISTS product_review_events (
  product_review_event_id BIGSERIAL PRIMARY KEY,
  product_id UUID REFERENCES products (product_id) ON DELETE CASCADE,
  normalized_code TEXT CHECK (
    normalized_code IS NULL
    OR normalized_code ~ '^[0-9]{8}$'
    OR normalized_code ~ '^[0-9]{13}$'
  ),
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'refresh_requested',
      'refresh_completed',
      'refresh_failed',
      'heuristic_selected',
      'manual_override'
    )
  ),
  actor TEXT NOT NULL DEFAULT 'system',
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_codes_product_id ON product_codes (product_id);
CREATE INDEX IF NOT EXISTS idx_product_provider_snapshots_lookup
  ON product_provider_snapshots (normalized_code, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_provider_snapshots_product
  ON product_provider_snapshots (product_id, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_refresh_requests_status_refresh_after
  ON product_refresh_requests (status, refresh_after, last_requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_normalized_name
  ON product_ingredients (normalized_name);
CREATE INDEX IF NOT EXISTS idx_product_food_candidates_lookup
  ON product_food_candidates (product_id, line_no, candidate_rank);
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_food_candidates_selected
  ON product_food_candidates (product_id, line_no)
  WHERE is_selected;
CREATE INDEX IF NOT EXISTS idx_product_assessments_product
  ON product_assessments (product_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_assessment_subtypes_source_food
  ON product_assessment_subtypes (source_food_id, subtype_code);
CREATE INDEX IF NOT EXISTS idx_product_review_events_product
  ON product_review_events (product_id, created_at DESC);

-- migrate:down

-- Forward-only migration. Do not rollback long-lived environments via dbmate.
SELECT 1;
