\set ON_ERROR_STOP on

DROP TABLE IF EXISTS stg_review;
CREATE TEMP TABLE stg_review (
  rule_key TEXT,
  from_priority_rank INTEGER,
  to_priority_rank INTEGER,
  scoring_version_snapshot TEXT,
  fodmap_safety_score_snapshot NUMERIC(4,3),
  from_level fodmap_level,
  to_level fodmap_level,
  from_burden_ratio NUMERIC,
  to_burden_ratio NUMERIC,
  to_coverage_ratio NUMERIC,
  auto_eligible BOOLEAN,
  review_decision TEXT,
  review_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT
);

\copy stg_review (rule_key,from_priority_rank,to_priority_rank,scoring_version_snapshot,fodmap_safety_score_snapshot,from_level,to_level,from_burden_ratio,to_burden_ratio,to_coverage_ratio,auto_eligible,review_decision,review_notes,reviewed_by,reviewed_at) FROM 'etl/phase3/decisions/phase3_swap_activation_review_v1.csv' WITH (FORMAT csv, HEADER true)

WITH expected_rules AS (
  SELECT *
  FROM (
    VALUES
      ('R01', 1, 3, 'technique_swap'),
      ('R02', 4, 8, 'direct_swap'),
      ('R03', 5, 8, 'direct_swap'),
      ('R04', 6, 8, 'direct_swap'),
      ('R05', 9, 8, 'direct_swap'),
      ('R06',10, 8, 'direct_swap'),
      ('R07',13,11, 'direct_swap'),
      ('R08',12,11, 'direct_swap'),
      ('R09',27,26, 'direct_swap'),
      ('R10',28,29, 'direct_swap'),
      ('R11',36,35, 'direct_swap'),
      ('R12',32,33, 'direct_swap')
  ) AS t(rule_key, from_priority_rank, to_priority_rank, rule_kind)
),
mvp_rules AS (
  SELECT
    r.swap_rule_id,
    r.rule_kind,
    p_from.priority_rank AS from_priority_rank,
    p_to.priority_rank AS to_priority_rank,
    sc.scoring_version,
    sc.fodmap_safety_score
  FROM swap_rules r
  JOIN sources src ON src.source_id = r.source_id
  JOIN swap_rule_scores sc ON sc.swap_rule_id = r.swap_rule_id
  JOIN phase2_priority_foods p_from ON p_from.resolved_food_id = r.from_food_id
  JOIN phase2_priority_foods p_to ON p_to.resolved_food_id = r.to_food_id
  WHERE src.source_slug = 'internal_rules_v1'
    AND r.notes = 'phase3_mvp_rule'
),
mapped_rules AS (
  SELECT
    e.rule_key,
    m.swap_rule_id,
    m.from_priority_rank,
    m.to_priority_rank,
    m.scoring_version,
    m.fodmap_safety_score
  FROM mvp_rules m
  JOIN expected_rules e
    ON e.from_priority_rank = m.from_priority_rank
   AND e.to_priority_rank = m.to_priority_rank
   AND e.rule_kind = m.rule_kind
),
endpoints AS (
  SELECT
    mr.rule_key,
    mr.swap_rule_id,
    mr.from_priority_rank,
    mr.to_priority_rank,
    mr.scoring_version,
    mr.fodmap_safety_score,
    vf.overall_level AS from_level,
    vt.overall_level AS to_level,
    vf.driver_subtype_code AS from_driver_subtype,
    vt.driver_subtype_code AS to_driver_subtype
  FROM mapped_rules mr
  JOIN v_phase3_rollups_latest_full vf ON vf.priority_rank = mr.from_priority_rank
  JOIN v_phase3_rollups_latest_full vt ON vt.priority_rank = mr.to_priority_rank
),
burdens AS (
  SELECT
    e.*,
    fd.burden_ratio AS from_burden_ratio,
    td.burden_ratio AS to_burden_ratio
  FROM endpoints e
  LEFT JOIN v_phase3_rollup_subtype_levels_latest fd
    ON fd.priority_rank = e.from_priority_rank
   AND fd.subtype_code = e.from_driver_subtype
  LEFT JOIN v_phase3_rollup_subtype_levels_latest td
    ON td.priority_rank = e.to_priority_rank
   AND td.subtype_code = e.to_driver_subtype
),
severity AS (
  SELECT
    b.*,
    CASE b.from_level
      WHEN 'none'::fodmap_level THEN 0
      WHEN 'low'::fodmap_level THEN 1
      WHEN 'moderate'::fodmap_level THEN 2
      WHEN 'high'::fodmap_level THEN 3
      ELSE NULL
    END AS from_severity,
    CASE b.to_level
      WHEN 'none'::fodmap_level THEN 0
      WHEN 'low'::fodmap_level THEN 1
      WHEN 'moderate'::fodmap_level THEN 2
      WHEN 'high'::fodmap_level THEN 3
      ELSE NULL
    END AS to_severity
  FROM burdens b
),
live_eval AS (
  SELECT
    s.rule_key,
    s.swap_rule_id,
    s.scoring_version,
    s.fodmap_safety_score,
    CASE
      WHEN s.from_severity IS NULL OR s.to_severity IS NULL THEN FALSE
      WHEN s.from_burden_ratio IS NULL OR s.to_burden_ratio IS NULL THEN FALSE
      WHEN s.to_severity > s.from_severity THEN FALSE
      WHEN s.to_burden_ratio > s.from_burden_ratio THEN FALSE
      WHEN s.fodmap_safety_score < 0.500 THEN FALSE
      ELSE TRUE
    END AS auto_eligible
  FROM severity s
),
calc AS (
  SELECT
    (SELECT COUNT(*) FROM stg_review)::int AS reviewed_snapshot_rows,
    (SELECT COUNT(*)
     FROM stg_review s
     JOIN live_eval l USING (rule_key)
     WHERE s.scoring_version_snapshot IS DISTINCT FROM l.scoring_version
        OR s.fodmap_safety_score_snapshot IS DISTINCT FROM l.fodmap_safety_score)::int AS snapshot_mismatch_rows,
    (SELECT COUNT(*)
     FROM stg_review s
     JOIN live_eval l USING (rule_key)
     WHERE s.auto_eligible IS DISTINCT FROM l.auto_eligible)::int AS auto_eligible_mismatch_rows,
    (SELECT COUNT(*)
     FROM stg_review s
     JOIN live_eval l USING (rule_key)
     WHERE s.review_decision = 'approve'
       AND l.auto_eligible = FALSE)::int AS approve_for_ineligible_rows,
    (SELECT MIN(scoring_version_snapshot) FROM stg_review) AS scoring_version_snapshot_actual,
    (SELECT MIN(fodmap_safety_score_snapshot)::text FROM stg_review) AS fodmap_safety_score_snapshot_actual
)
SELECT jsonb_build_object(
  '_contract_refs', jsonb_build_array(
    'etl/phase3/sql/phase3_swap_activation_apply.sql',
    'etl/phase3/PRODUCT_LAYER_RUNBOOK.md'
  ),
  'reviewed_snapshot_rows', reviewed_snapshot_rows,
  'snapshot_mismatch_rows', snapshot_mismatch_rows,
  'auto_eligible_mismatch_rows', auto_eligible_mismatch_rows,
  'approve_for_ineligible_rows', approve_for_ineligible_rows,
  'scoring_version_snapshot_actual', scoring_version_snapshot_actual,
  'fodmap_safety_score_snapshot_actual', fodmap_safety_score_snapshot_actual
)::text
FROM calc;
