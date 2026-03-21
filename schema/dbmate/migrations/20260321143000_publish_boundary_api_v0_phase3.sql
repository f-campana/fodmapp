-- migrate:up

CREATE TABLE publish_releases (
  publish_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_kind TEXT NOT NULL CHECK (length(trim(release_kind)) > 0),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rollup_computed_at_max TIMESTAMPTZ,
  rollup_row_count INTEGER NOT NULL DEFAULT 0 CHECK (rollup_row_count >= 0),
  subtype_row_count INTEGER NOT NULL DEFAULT 0 CHECK (subtype_row_count >= 0),
  swap_row_count INTEGER NOT NULL DEFAULT 0 CHECK (swap_row_count >= 0),
  notes TEXT
);

CREATE TABLE publish_release_current (
  release_kind TEXT PRIMARY KEY CHECK (length(trim(release_kind)) > 0),
  publish_id UUID NOT NULL REFERENCES publish_releases (publish_id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE published_food_rollups (
  publish_id UUID NOT NULL REFERENCES publish_releases (publish_id) ON DELETE CASCADE,
  priority_rank INTEGER NOT NULL CHECK (priority_rank > 0),
  food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  rollup_serving_g NUMERIC(8,2) CHECK (rollup_serving_g IS NULL OR rollup_serving_g > 0),
  overall_level fodmap_level NOT NULL,
  driver_subtype_code TEXT REFERENCES fodmap_subtypes (code),
  known_subtypes_count INTEGER NOT NULL CHECK (known_subtypes_count BETWEEN 0 AND 6),
  coverage_ratio NUMERIC(6,4) NOT NULL CHECK (coverage_ratio >= 0 AND coverage_ratio <= 1),
  source_slug TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (publish_id, food_id),
  UNIQUE (publish_id, priority_rank)
);

CREATE TABLE published_food_subtype_levels (
  publish_id UUID NOT NULL REFERENCES publish_releases (publish_id) ON DELETE CASCADE,
  priority_rank INTEGER NOT NULL CHECK (priority_rank > 0),
  food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  rollup_serving_g NUMERIC(8,2) CHECK (rollup_serving_g IS NULL OR rollup_serving_g > 0),
  subtype_code TEXT NOT NULL REFERENCES fodmap_subtypes (code),
  fodmap_subtype_id SMALLINT REFERENCES fodmap_subtypes (fodmap_subtype_id),
  amount_g_per_serving NUMERIC(12,6),
  comparator comparator_code,
  low_max_g NUMERIC(12,6),
  moderate_max_g NUMERIC(12,6),
  subtype_level fodmap_level NOT NULL,
  signal_source_kind TEXT,
  signal_source_slug TEXT,
  threshold_source_slug TEXT,
  is_default_threshold BOOLEAN NOT NULL DEFAULT FALSE,
  is_polyol_proxy BOOLEAN NOT NULL DEFAULT FALSE,
  burden_ratio NUMERIC(12,6),
  computed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (publish_id, food_id, subtype_code)
);

CREATE TABLE published_swaps (
  publish_id UUID NOT NULL REFERENCES publish_releases (publish_id) ON DELETE CASCADE,
  swap_rule_id UUID NOT NULL,
  from_food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  to_food_id UUID NOT NULL REFERENCES foods (food_id) ON DELETE CASCADE,
  from_food_slug TEXT NOT NULL,
  to_food_slug TEXT NOT NULL,
  from_food_name_fr TEXT,
  from_food_name_en TEXT,
  to_food_name_fr TEXT,
  to_food_name_en TEXT,
  instruction_fr TEXT NOT NULL,
  instruction_en TEXT NOT NULL,
  rule_status swap_status NOT NULL,
  source_slug TEXT NOT NULL,
  scoring_version TEXT NOT NULL,
  fodmap_safety_score NUMERIC(4,3) NOT NULL CHECK (fodmap_safety_score >= 0 AND fodmap_safety_score <= 1),
  overall_score NUMERIC(4,3) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 1),
  from_priority_rank INTEGER CHECK (from_priority_rank IS NULL OR from_priority_rank > 0),
  to_priority_rank INTEGER CHECK (to_priority_rank IS NULL OR to_priority_rank > 0),
  from_overall_level fodmap_level NOT NULL,
  to_overall_level fodmap_level NOT NULL,
  driver_subtype TEXT REFERENCES fodmap_subtypes (code),
  from_burden_ratio NUMERIC(12,6),
  to_burden_ratio NUMERIC(12,6),
  coverage_ratio NUMERIC(6,4) NOT NULL CHECK (coverage_ratio >= 0 AND coverage_ratio <= 1),
  rollup_computed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (publish_id, swap_rule_id)
);

CREATE VIEW api_publish_meta_current AS
SELECT
  pr.publish_id::text AS publish_id,
  pr.release_kind,
  pr.published_at,
  pr.rollup_computed_at_max,
  pr.rollup_row_count,
  pr.subtype_row_count,
  pr.swap_row_count
FROM publish_releases pr
JOIN publish_release_current cur
  ON cur.publish_id = pr.publish_id
WHERE cur.release_kind = 'api_v0_phase3';

CREATE VIEW api_food_rollups_current AS
SELECT
  pfr.publish_id,
  pfr.priority_rank,
  pfr.food_id,
  pfr.rollup_serving_g,
  pfr.overall_level,
  pfr.driver_subtype_code,
  pfr.known_subtypes_count,
  pfr.coverage_ratio,
  pfr.source_slug,
  pfr.computed_at
FROM published_food_rollups pfr
JOIN publish_release_current cur
  ON cur.publish_id = pfr.publish_id
WHERE cur.release_kind = 'api_v0_phase3';

CREATE VIEW api_food_subtypes_current AS
SELECT
  pfs.publish_id,
  pfs.priority_rank,
  pfs.food_id,
  pfs.rollup_serving_g,
  pfs.subtype_code,
  pfs.fodmap_subtype_id,
  pfs.amount_g_per_serving,
  pfs.comparator,
  pfs.low_max_g,
  pfs.moderate_max_g,
  pfs.subtype_level,
  pfs.signal_source_kind,
  pfs.signal_source_slug,
  pfs.threshold_source_slug,
  pfs.is_default_threshold,
  pfs.is_polyol_proxy,
  pfs.burden_ratio,
  pfs.computed_at
FROM published_food_subtype_levels pfs
JOIN publish_release_current cur
  ON cur.publish_id = pfs.publish_id
WHERE cur.release_kind = 'api_v0_phase3';

CREATE VIEW api_swaps_current AS
SELECT
  ps.publish_id,
  ps.swap_rule_id,
  ps.from_food_id,
  ps.to_food_id,
  ps.from_food_slug,
  ps.to_food_slug,
  ps.from_food_name_fr,
  ps.from_food_name_en,
  ps.to_food_name_fr,
  ps.to_food_name_en,
  ps.instruction_fr,
  ps.instruction_en,
  ps.rule_status,
  ps.source_slug,
  ps.scoring_version,
  ps.fodmap_safety_score,
  ps.overall_score,
  ps.from_priority_rank,
  ps.to_priority_rank,
  ps.from_overall_level,
  ps.to_overall_level,
  ps.driver_subtype,
  ps.from_burden_ratio,
  ps.to_burden_ratio,
  ps.coverage_ratio,
  ps.rollup_computed_at
FROM published_swaps ps
JOIN publish_release_current cur
  ON cur.publish_id = ps.publish_id
WHERE cur.release_kind = 'api_v0_phase3';

CREATE INDEX idx_publish_releases_kind_published_at ON publish_releases (release_kind, published_at DESC);
CREATE INDEX idx_published_food_rollups_publish_food ON published_food_rollups (publish_id, food_id);
CREATE INDEX idx_published_food_rollups_publish_priority ON published_food_rollups (publish_id, priority_rank);
CREATE INDEX idx_published_food_subtypes_publish_food ON published_food_subtype_levels (publish_id, food_id);
CREATE INDEX idx_published_swaps_publish_from_food ON published_swaps (publish_id, from_food_slug);
CREATE INDEX idx_published_swaps_publish_rule_status ON published_swaps (publish_id, rule_status, from_food_slug);

-- migrate:down

DO $$
BEGIN
  RAISE NOTICE 'publish_boundary_api_v0_phase3 is forward-only; no down migration is provided.';
END $$;
