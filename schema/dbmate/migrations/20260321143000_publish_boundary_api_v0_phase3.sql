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

CREATE VIEW v_phase3_rollup_subtype_levels_latest AS
SELECT
  NULL::INTEGER AS priority_rank,
  NULL::UUID AS food_id,
  NULL::NUMERIC(8,2) AS rollup_serving_g,
  NULL::TEXT AS subtype_code,
  NULL::SMALLINT AS fodmap_subtype_id,
  NULL::NUMERIC(12,6) AS amount_g_per_serving,
  NULL::comparator_code AS comparator,
  NULL::NUMERIC(12,6) AS low_max_g,
  NULL::NUMERIC(12,6) AS moderate_max_g,
  NULL::fodmap_level AS subtype_level,
  NULL::TEXT AS signal_source_kind,
  NULL::TEXT AS signal_source_slug,
  NULL::TEXT AS threshold_source,
  NULL::TEXT AS threshold_source_slug,
  NULL::BOOLEAN AS is_default_threshold,
  NULL::BOOLEAN AS is_polyol_proxy,
  NULL::TEXT AS default_threshold_citation_ref,
  NULL::TEXT AS default_threshold_derivation_method,
  NULL::INTEGER AS severity_rank,
  NULL::NUMERIC(12,6) AS burden_ratio,
  NULL::TIMESTAMPTZ AS computed_at
WHERE FALSE;

CREATE VIEW v_phase3_rollups_latest_full AS
SELECT
  NULL::INTEGER AS priority_rank,
  NULL::UUID AS food_id,
  NULL::NUMERIC(8,2) AS rollup_serving_g,
  NULL::fodmap_level AS overall_level,
  NULL::TEXT AS driver_subtype_code,
  NULL::INTEGER AS known_subtypes_count,
  NULL::NUMERIC(6,4) AS coverage_ratio,
  NULL::TIMESTAMPTZ AS computed_at,
  NULL::TEXT AS source_slug
WHERE FALSE;

CREATE VIEW api_publish_meta_current AS
WITH current_release AS (
  SELECT cur.publish_id
  FROM publish_release_current cur
  WHERE cur.release_kind = 'api_v0_phase3'
)
SELECT
  pr.publish_id::text AS publish_id,
  pr.release_kind,
  pr.published_at,
  pr.rollup_computed_at_max,
  pr.rollup_row_count,
  pr.subtype_row_count,
  pr.swap_row_count
FROM publish_releases pr
JOIN current_release cur
  ON cur.publish_id = pr.publish_id
UNION ALL
SELECT
  NULL::text AS publish_id,
  'api_v0_phase3'::text AS release_kind,
  NULL::TIMESTAMPTZ AS published_at,
  (SELECT MAX(v.computed_at) FROM v_phase3_rollups_latest_full v) AS rollup_computed_at_max,
  (SELECT COUNT(*)::int FROM v_phase3_rollups_latest_full) AS rollup_row_count,
  (SELECT COUNT(*)::int FROM v_phase3_rollup_subtype_levels_latest) AS subtype_row_count,
  (
    WITH active_rules AS (
      SELECT r.swap_rule_id
      FROM swap_rules r
      LEFT JOIN phase2_priority_foods p_from ON p_from.resolved_food_id = r.from_food_id
      LEFT JOIN phase2_priority_foods p_to ON p_to.resolved_food_id = r.to_food_id
      WHERE r.status = 'active'
        AND COALESCE(p_from.priority_rank, 0) <> 2
        AND COALESCE(p_to.priority_rank, 0) <> 2
    )
    SELECT COUNT(*)::int
    FROM active_rules
  ) AS swap_row_count
WHERE NOT EXISTS (SELECT 1 FROM current_release);

CREATE VIEW api_food_rollups_current AS
WITH current_release AS (
  SELECT cur.publish_id
  FROM publish_release_current cur
  WHERE cur.release_kind = 'api_v0_phase3'
)
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
JOIN current_release cur
  ON cur.publish_id = pfr.publish_id
UNION ALL
SELECT
  NULL::UUID AS publish_id,
  v.priority_rank,
  v.food_id,
  v.rollup_serving_g,
  v.overall_level,
  v.driver_subtype_code,
  v.known_subtypes_count,
  v.coverage_ratio,
  v.source_slug,
  v.computed_at
FROM v_phase3_rollups_latest_full v
WHERE NOT EXISTS (SELECT 1 FROM current_release);

CREATE VIEW api_food_subtypes_current AS
WITH current_release AS (
  SELECT cur.publish_id
  FROM publish_release_current cur
  WHERE cur.release_kind = 'api_v0_phase3'
)
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
JOIN current_release cur
  ON cur.publish_id = pfs.publish_id
UNION ALL
SELECT
  NULL::UUID AS publish_id,
  v.priority_rank,
  v.food_id,
  v.rollup_serving_g,
  v.subtype_code,
  v.fodmap_subtype_id,
  v.amount_g_per_serving,
  v.comparator,
  v.low_max_g,
  v.moderate_max_g,
  v.subtype_level,
  v.signal_source_kind,
  v.signal_source_slug,
  v.threshold_source_slug,
  v.is_default_threshold,
  v.is_polyol_proxy,
  v.burden_ratio,
  v.computed_at
FROM v_phase3_rollup_subtype_levels_latest v
WHERE NOT EXISTS (SELECT 1 FROM current_release);

CREATE VIEW api_swaps_current AS
WITH current_release AS (
  SELECT cur.publish_id
  FROM publish_release_current cur
  WHERE cur.release_kind = 'api_v0_phase3'
),
published_rows AS (
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
  JOIN current_release cur
    ON cur.publish_id = ps.publish_id
),
fallback_rows AS (
  WITH active_rules AS (
    SELECT
      r.swap_rule_id,
      r.from_food_id,
      r.to_food_id,
      f_from.food_slug AS from_food_slug,
      f_to.food_slug AS to_food_slug,
      f_from.canonical_name_fr AS from_food_name_fr,
      f_from.canonical_name_en AS from_food_name_en,
      f_to.canonical_name_fr AS to_food_name_fr,
      f_to.canonical_name_en AS to_food_name_en,
      r.instruction_fr,
      COALESCE(r.instruction_en, r.instruction_fr) AS instruction_en,
      r.status AS rule_status,
      src.source_slug,
      rs.scoring_version,
      rs.fodmap_safety_score,
      rs.overall_score,
      p_from.priority_rank AS from_priority_rank,
      p_to.priority_rank AS to_priority_rank,
      COALESCE(vrf.overall_level, 'unknown'::fodmap_level) AS from_overall_level,
      COALESCE(vrt.overall_level, 'unknown'::fodmap_level) AS to_overall_level,
      vrt.driver_subtype_code AS driver_subtype,
      COALESCE(vrt.coverage_ratio, 0)::numeric(6,4) AS coverage_ratio,
      COALESCE(vrt.computed_at, vrf.computed_at) AS rollup_computed_at
    FROM swap_rules r
    JOIN foods f_from ON f_from.food_id = r.from_food_id
    JOIN foods f_to ON f_to.food_id = r.to_food_id
    JOIN swap_rule_scores rs ON rs.swap_rule_id = r.swap_rule_id
    JOIN sources src ON src.source_id = r.source_id
    LEFT JOIN phase2_priority_foods p_from ON p_from.resolved_food_id = r.from_food_id
    LEFT JOIN phase2_priority_foods p_to ON p_to.resolved_food_id = r.to_food_id
    LEFT JOIN v_phase3_rollups_latest_full vrf ON vrf.food_id = r.from_food_id
    LEFT JOIN v_phase3_rollups_latest_full vrt ON vrt.food_id = r.to_food_id
    WHERE r.status = 'active'
      AND COALESCE(p_from.priority_rank, 0) <> 2
      AND COALESCE(p_to.priority_rank, 0) <> 2
  ),
  with_burden AS (
    SELECT
      ar.*,
      fd.burden_ratio AS from_burden_ratio,
      td.burden_ratio AS to_burden_ratio
    FROM active_rules ar
    LEFT JOIN v_phase3_rollup_subtype_levels_latest fd
      ON fd.priority_rank = ar.from_priority_rank
     AND fd.subtype_code = ar.driver_subtype
    LEFT JOIN v_phase3_rollup_subtype_levels_latest td
      ON td.priority_rank = ar.to_priority_rank
     AND td.subtype_code = ar.driver_subtype
  )
  SELECT
    NULL::UUID AS publish_id,
    wb.swap_rule_id,
    wb.from_food_id,
    wb.to_food_id,
    wb.from_food_slug,
    wb.to_food_slug,
    wb.from_food_name_fr,
    wb.from_food_name_en,
    wb.to_food_name_fr,
    wb.to_food_name_en,
    wb.instruction_fr,
    wb.instruction_en,
    wb.rule_status,
    wb.source_slug,
    wb.scoring_version,
    wb.fodmap_safety_score,
    wb.overall_score,
    wb.from_priority_rank,
    wb.to_priority_rank,
    wb.from_overall_level,
    wb.to_overall_level,
    wb.driver_subtype,
    wb.from_burden_ratio,
    wb.to_burden_ratio,
    wb.coverage_ratio,
    wb.rollup_computed_at
  FROM with_burden wb
  WHERE NOT EXISTS (SELECT 1 FROM current_release)
)
SELECT * FROM published_rows
UNION ALL
SELECT * FROM fallback_rows;

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
