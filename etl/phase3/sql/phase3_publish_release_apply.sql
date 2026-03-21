BEGIN ISOLATION LEVEL REPEATABLE READ;

CREATE TEMP TABLE tmp_phase3_publish_release ON COMMIT DROP AS
SELECT
  gen_random_uuid() AS publish_id,
  'api_v0_phase3'::text AS release_kind,
  now() AS published_at;

INSERT INTO publish_releases (
  publish_id,
  release_kind,
  published_at,
  rollup_computed_at_max,
  rollup_row_count,
  subtype_row_count,
  swap_row_count
)
WITH swap_source AS (
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
      rs.fodmap_safety_score,
      rs.overall_score,
      rs.scoring_version,
      src.source_slug,
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
  SELECT *
  FROM with_burden
)
SELECT
  rel.publish_id,
  rel.release_kind,
  rel.published_at,
  (SELECT MAX(v.computed_at) FROM v_phase3_rollups_latest_full v),
  (SELECT COUNT(*)::int FROM v_phase3_rollups_latest_full),
  (SELECT COUNT(*)::int FROM v_phase3_rollup_subtype_levels_latest),
  (SELECT COUNT(*)::int FROM swap_source)
FROM tmp_phase3_publish_release rel;

INSERT INTO published_food_rollups (
  publish_id,
  priority_rank,
  food_id,
  rollup_serving_g,
  overall_level,
  driver_subtype_code,
  known_subtypes_count,
  coverage_ratio,
  source_slug,
  computed_at
)
SELECT
  rel.publish_id,
  v.priority_rank,
  v.food_id,
  v.rollup_serving_g,
  v.overall_level,
  v.driver_subtype_code,
  v.known_subtypes_count,
  v.coverage_ratio,
  v.source_slug,
  v.computed_at
FROM tmp_phase3_publish_release rel
CROSS JOIN v_phase3_rollups_latest_full v;

INSERT INTO published_food_subtype_levels (
  publish_id,
  priority_rank,
  food_id,
  rollup_serving_g,
  subtype_code,
  fodmap_subtype_id,
  amount_g_per_serving,
  comparator,
  low_max_g,
  moderate_max_g,
  subtype_level,
  signal_source_kind,
  signal_source_slug,
  threshold_source_slug,
  is_default_threshold,
  is_polyol_proxy,
  burden_ratio,
  computed_at
)
SELECT
  rel.publish_id,
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
FROM tmp_phase3_publish_release rel
CROSS JOIN v_phase3_rollup_subtype_levels_latest v;

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
    rs.fodmap_safety_score,
    rs.overall_score,
    rs.scoring_version,
    src.source_slug,
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
INSERT INTO published_swaps (
  publish_id,
  swap_rule_id,
  from_food_id,
  to_food_id,
  from_food_slug,
  to_food_slug,
  from_food_name_fr,
  from_food_name_en,
  to_food_name_fr,
  to_food_name_en,
  instruction_fr,
  instruction_en,
  rule_status,
  source_slug,
  scoring_version,
  fodmap_safety_score,
  overall_score,
  from_priority_rank,
  to_priority_rank,
  from_overall_level,
  to_overall_level,
  driver_subtype,
  from_burden_ratio,
  to_burden_ratio,
  coverage_ratio,
  rollup_computed_at
)
SELECT
  rel.publish_id,
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
FROM tmp_phase3_publish_release rel
JOIN with_burden wb ON TRUE;

INSERT INTO publish_release_current (
  release_kind,
  publish_id,
  updated_at
)
SELECT
  release_kind,
  publish_id,
  published_at
FROM tmp_phase3_publish_release
ON CONFLICT (release_kind) DO UPDATE
SET publish_id = EXCLUDED.publish_id,
    updated_at = EXCLUDED.updated_at;

COMMIT;
