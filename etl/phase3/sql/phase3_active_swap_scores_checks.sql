\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  v_active_rank2_count INTEGER;
  v_mismatch_count INTEGER;
  v_ineligible_active_count INTEGER;
  v_reserved_version_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_active_rank2_count
  FROM swap_rules r
  LEFT JOIN phase2_priority_foods p_from ON p_from.resolved_food_id = r.from_food_id
  LEFT JOIN phase2_priority_foods p_to ON p_to.resolved_food_id = r.to_food_id
  WHERE r.status = 'active'
    AND (
      COALESCE(p_from.priority_rank, 0) = 2
      OR COALESCE(p_to.priority_rank, 0) = 2
    );

  IF v_active_rank2_count <> 0 THEN
    RAISE EXCEPTION 'active swap refresh failed rank2 exclusion: % active rows reference priority rank 2', v_active_rank2_count;
  END IF;

  CREATE TEMP TABLE expected_active_scores_check ON COMMIT DROP AS
  WITH expected_scores AS (
    WITH active_rules AS (
      SELECT
        r.swap_rule_id,
        p_from.priority_rank AS from_priority_rank,
        p_to.priority_rank AS to_priority_rank,
        COALESCE(vrf.overall_level, 'unknown'::fodmap_level) AS from_level,
        COALESCE(vrt.overall_level, 'unknown'::fodmap_level) AS to_level,
        COALESCE(vrt.coverage_ratio, 0)::NUMERIC(6,4) AS to_coverage_ratio,
        vrt.driver_subtype_code AS driver_subtype
      FROM swap_rules r
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
    ),
    components AS (
      SELECT
        wb.*,
        CASE wb.from_level
          WHEN 'none'::fodmap_level THEN 0
          WHEN 'low'::fodmap_level THEN 1
          WHEN 'moderate'::fodmap_level THEN 2
          WHEN 'high'::fodmap_level THEN 3
          ELSE NULL
        END AS from_severity,
        CASE wb.to_level
          WHEN 'none'::fodmap_level THEN 0
          WHEN 'low'::fodmap_level THEN 1
          WHEN 'moderate'::fodmap_level THEN 2
          WHEN 'high'::fodmap_level THEN 3
          ELSE NULL
        END AS to_severity
      FROM with_burden wb
    ),
    scored AS (
      SELECT
        c.*,
        CASE
          WHEN c.from_severity IS NULL OR c.to_severity IS NULL THEN NULL
          WHEN (c.from_severity - c.to_severity) >= 2 THEN 0.95
          WHEN (c.from_severity - c.to_severity) = 1 THEN 0.80
          WHEN (c.from_severity - c.to_severity) = 0 THEN 0.60
          ELSE 0.00
        END AS level_score,
        CASE
          WHEN c.from_severity IS NULL OR c.to_severity IS NULL THEN NULL
          WHEN c.from_burden_ratio IS NULL OR c.to_burden_ratio IS NULL THEN 0.50
          WHEN c.from_burden_ratio <= 0 AND c.to_burden_ratio <= 0 THEN 1.00
          WHEN c.from_burden_ratio <= 0 AND c.to_burden_ratio > 0 THEN 0.00
          ELSE GREATEST(
            0.00,
            LEAST(1.00, 0.50 + ((c.from_burden_ratio - c.to_burden_ratio) / c.from_burden_ratio) * 0.50)
          )
        END AS burden_score,
        CASE
          WHEN c.from_severity IS NULL OR c.to_severity IS NULL THEN 0.00
          WHEN c.to_coverage_ratio >= 0.67 THEN 0.00
          WHEN c.to_coverage_ratio >= 0.50 THEN -0.03
          WHEN c.to_coverage_ratio >= 0.33 THEN -0.06
          ELSE -0.08
        END AS coverage_penalty
      FROM components c
    ),
    final_scored AS (
      SELECT
        s.*,
        CASE
          WHEN s.from_severity IS NULL OR s.to_severity IS NULL THEN 0.000::NUMERIC(4,3)
          ELSE ROUND(
            GREATEST(
              0.00,
              LEAST(1.00, (0.70 * s.level_score + 0.30 * s.burden_score + s.coverage_penalty))
            )::NUMERIC,
            3
          )::NUMERIC(4,3)
        END AS expected_fodmap_safety_score
      FROM scored s
    )
    SELECT
      f.swap_rule_id,
      f.expected_fodmap_safety_score,
      CASE
        WHEN f.from_severity IS NULL OR f.to_severity IS NULL THEN FALSE
        WHEN f.from_burden_ratio IS NULL OR f.to_burden_ratio IS NULL THEN FALSE
        WHEN f.to_severity > f.from_severity THEN FALSE
        WHEN f.to_burden_ratio > f.from_burden_ratio THEN FALSE
        WHEN f.expected_fodmap_safety_score < 0.500 THEN FALSE
        ELSE TRUE
      END AS conservative_eligible
    FROM final_scored f
  )
  SELECT *
  FROM expected_scores;

  SELECT COUNT(*)
  INTO v_mismatch_count
  FROM expected_active_scores_check e
  JOIN swap_rule_scores s ON s.swap_rule_id = e.swap_rule_id
  WHERE s.fodmap_safety_score IS DISTINCT FROM e.expected_fodmap_safety_score;

  IF v_mismatch_count <> 0 THEN
    RAISE EXCEPTION 'active swap refresh score mismatch: % active rows do not match recomputed fodmap_safety_score', v_mismatch_count;
  END IF;

  SELECT COUNT(*)
  INTO v_ineligible_active_count
  FROM expected_active_scores_check e
  WHERE e.conservative_eligible = FALSE;

  IF v_ineligible_active_count <> 0 THEN
    RAISE EXCEPTION 'active swap refresh safety gate failed: % active rows are no longer conservative-eligible after refresh', v_ineligible_active_count;
  END IF;

  SELECT COUNT(*)
  INTO v_reserved_version_count
  FROM swap_rules r
  JOIN swap_rule_scores s ON s.swap_rule_id = r.swap_rule_id
  LEFT JOIN phase2_priority_foods p_from ON p_from.resolved_food_id = r.from_food_id
  LEFT JOIN phase2_priority_foods p_to ON p_to.resolved_food_id = r.to_food_id
  WHERE r.status = 'active'
    AND COALESCE(p_from.priority_rank, 0) <> 2
    AND COALESCE(p_to.priority_rank, 0) <> 2
    AND s.scoring_version = 'v3_active_refresh_2026_03_21';

  IF v_reserved_version_count <> 0 THEN
    RAISE EXCEPTION 'active swap refresh must preserve Gate B scoring_version snapshots: % active rows were relabeled with v3_active_refresh_2026_03_21', v_reserved_version_count;
  END IF;
END
$$;

COMMIT;
