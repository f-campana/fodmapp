\set ON_ERROR_STOP on

BEGIN;

-- Phase 3.1b Gate A:
-- Re-score MVP swap rules against full 6-subtype rollups and export review packet CSV.

CREATE TEMP TABLE expected_rules (
  rule_key TEXT PRIMARY KEY,
  from_priority_rank INTEGER NOT NULL,
  to_priority_rank INTEGER NOT NULL,
  rule_kind TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO expected_rules(rule_key, from_priority_rank, to_priority_rank, rule_kind)
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
  ('R12',32,33, 'direct_swap');

CREATE TEMP TABLE mvp_rules ON COMMIT DROP AS
SELECT
  r.swap_rule_id,
  r.rule_kind,
  p_from.priority_rank AS from_priority_rank,
  p_to.priority_rank AS to_priority_rank
FROM swap_rules r
JOIN sources src ON src.source_id = r.source_id
JOIN phase2_priority_foods p_from ON p_from.resolved_food_id = r.from_food_id
JOIN phase2_priority_foods p_to ON p_to.resolved_food_id = r.to_food_id
WHERE src.source_slug = 'internal_rules_v1'
  AND r.notes = 'phase3_mvp_rule';

DO $$
DECLARE
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count FROM mvp_rules;
  IF bad_count <> 12 THEN
    RAISE EXCEPTION 'expected 12 MVP rules, got %', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT m.from_priority_rank, m.to_priority_rank, m.rule_kind
    FROM mvp_rules m
    EXCEPT
    SELECT e.from_priority_rank, e.to_priority_rank, e.rule_kind
    FROM expected_rules e
  ) extra;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'MVP rules contain mappings outside locked expected set';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT e.from_priority_rank, e.to_priority_rank, e.rule_kind
    FROM expected_rules e
    EXCEPT
    SELECT m.from_priority_rank, m.to_priority_rank, m.rule_kind
    FROM mvp_rules m
  ) missing;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'MVP rules missing required locked mappings';
  END IF;
END $$;

CREATE TEMP TABLE rescore_snapshot ON COMMIT DROP AS
WITH mapped_rules AS (
  SELECT
    e.rule_key,
    m.swap_rule_id,
    m.from_priority_rank,
    m.to_priority_rank
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
    vf.overall_level AS from_level,
    vt.overall_level AS to_level,
    vf.coverage_ratio AS from_coverage_ratio,
    vt.coverage_ratio AS to_coverage_ratio,
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
components AS (
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
    END AS recomputed_fodmap_safety_score
  FROM scored s
),
with_eligibility AS (
  SELECT
    f.*,
    CASE
      WHEN f.from_severity IS NULL OR f.to_severity IS NULL THEN FALSE
      WHEN f.from_burden_ratio IS NULL OR f.to_burden_ratio IS NULL THEN FALSE
      WHEN f.to_severity > f.from_severity THEN FALSE
      WHEN f.to_burden_ratio > f.from_burden_ratio THEN FALSE
      WHEN f.recomputed_fodmap_safety_score < 0.500 THEN FALSE
      ELSE TRUE
    END AS auto_eligible
  FROM final_scored f
)
SELECT
  w.rule_key,
  w.swap_rule_id,
  w.from_priority_rank,
  w.to_priority_rank,
  w.from_level,
  w.to_level,
  w.from_burden_ratio,
  w.to_burden_ratio,
  w.from_coverage_ratio,
  w.to_coverage_ratio,
  w.recomputed_fodmap_safety_score,
  w.auto_eligible
FROM with_eligibility w;

DO $$
DECLARE
  r01_eligible BOOLEAN;
BEGIN
  SELECT auto_eligible INTO r01_eligible
  FROM rescore_snapshot
  WHERE rule_key = 'R01';

  IF r01_eligible IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'R01 gate failed: expected auto_eligible=TRUE in current dataset, got %', r01_eligible;
  END IF;
END $$;

WITH updated AS (
  UPDATE swap_rule_scores s
  SET
    scoring_version = 'v2_full_rollup_2026_02_18',
    fodmap_safety_score = rs.recomputed_fodmap_safety_score
  FROM rescore_snapshot rs
  WHERE s.swap_rule_id = rs.swap_rule_id
    AND (
      s.scoring_version IS DISTINCT FROM 'v2_full_rollup_2026_02_18'
      OR s.fodmap_safety_score IS DISTINCT FROM rs.recomputed_fodmap_safety_score
    )
  RETURNING s.swap_rule_id
)
SELECT
  (SELECT COUNT(*) FROM rescore_snapshot) AS rescored_rules,
  (SELECT COUNT(*) FROM updated) AS score_rows_updated;

CREATE TEMP TABLE review_export ON COMMIT DROP AS
SELECT
  rs.rule_key,
  rs.from_priority_rank,
  rs.to_priority_rank,
  'v2_full_rollup_2026_02_18'::TEXT AS scoring_version_snapshot,
  rs.recomputed_fodmap_safety_score AS fodmap_safety_score_snapshot,
  rs.from_level,
  rs.to_level,
  ROUND(rs.from_burden_ratio::NUMERIC, 6) AS from_burden_ratio,
  ROUND(rs.to_burden_ratio::NUMERIC, 6) AS to_burden_ratio,
  ROUND(rs.to_coverage_ratio::NUMERIC, 6) AS to_coverage_ratio,
  rs.auto_eligible,
  CASE WHEN rs.auto_eligible THEN 'approve' ELSE 'reject' END AS review_decision,
  ''::TEXT AS review_notes,
  ''::TEXT AS reviewed_by,
  ''::TEXT AS reviewed_at
FROM rescore_snapshot rs
ORDER BY rs.rule_key;

\copy review_export TO program 'sh -c "cat > \"${PHASE3_REVIEW_EXPORT_PATH:-etl/phase3/decisions/phase3_swap_activation_review_v1.csv}\""' WITH (FORMAT csv, HEADER true)

SELECT
  rule_key,
  from_priority_rank,
  to_priority_rank,
  from_level,
  to_level,
  ROUND(from_burden_ratio::NUMERIC, 3) AS from_burden,
  ROUND(to_burden_ratio::NUMERIC, 3) AS to_burden,
  recomputed_fodmap_safety_score,
  auto_eligible
FROM rescore_snapshot
ORDER BY rule_key;

COMMIT;
