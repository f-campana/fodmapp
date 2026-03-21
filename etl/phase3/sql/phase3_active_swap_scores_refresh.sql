\set ON_ERROR_STOP on

BEGIN;

-- Operator-safe Phase 3 refresh lane:
-- recompute fodmap_safety_score for currently active swap rules only.
-- This is additive to Gate A / Gate B review flows and must never export CSVs
-- or mutate rule status.

CREATE TEMP TABLE active_score_refresh_snapshot ON COMMIT DROP AS
WITH active_rules AS (
  SELECT
    r.swap_rule_id,
    r.from_food_id,
    r.to_food_id,
    p_from.priority_rank AS from_priority_rank,
    p_to.priority_rank AS to_priority_rank,
    s.scoring_version AS current_scoring_version,
    COALESCE(vrf.overall_level, 'unknown'::fodmap_level) AS from_level,
    COALESCE(vrt.overall_level, 'unknown'::fodmap_level) AS to_level,
    COALESCE(vrf.coverage_ratio, 0)::NUMERIC(6,4) AS from_coverage_ratio,
    COALESCE(vrt.coverage_ratio, 0)::NUMERIC(6,4) AS to_coverage_ratio,
    vrt.driver_subtype_code AS driver_subtype
  FROM swap_rules r
  JOIN swap_rule_scores s ON s.swap_rule_id = r.swap_rule_id
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
)
SELECT
  s.swap_rule_id,
  s.from_priority_rank,
  s.to_priority_rank,
  s.current_scoring_version,
  s.from_level,
  s.to_level,
  s.driver_subtype,
  s.from_burden_ratio,
  s.to_burden_ratio,
  s.to_coverage_ratio,
  CASE
    WHEN s.from_severity IS NULL OR s.to_severity IS NULL THEN 0.000::NUMERIC(4,3)
    ELSE ROUND(
      GREATEST(
        0.00,
        LEAST(1.00, (0.70 * s.level_score + 0.30 * s.burden_score + s.coverage_penalty))
      )::NUMERIC,
      3
    )::NUMERIC(4,3)
  END AS recomputed_fodmap_safety_score
FROM scored s;

WITH updated AS (
  UPDATE swap_rule_scores s
  SET
    -- Preserve activation-era review snapshots while refreshing the live active score.
    scoring_version = snap.current_scoring_version,
    fodmap_safety_score = snap.recomputed_fodmap_safety_score
  FROM active_score_refresh_snapshot snap
  WHERE s.swap_rule_id = snap.swap_rule_id
    AND (
      s.scoring_version IS DISTINCT FROM snap.current_scoring_version
      OR s.fodmap_safety_score IS DISTINCT FROM snap.recomputed_fodmap_safety_score
    )
  RETURNING s.swap_rule_id
)
SELECT
  (SELECT COUNT(*) FROM active_score_refresh_snapshot) AS active_rules_evaluated,
  (SELECT COUNT(*) FROM updated) AS score_rows_updated;

COMMIT;
