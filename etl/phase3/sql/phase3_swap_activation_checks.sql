\set ON_ERROR_STOP on

BEGIN;

-- Phase 3.1b post-activation checks.

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
) ON COMMIT DROP;

\copy stg_review (rule_key,from_priority_rank,to_priority_rank,scoring_version_snapshot,fodmap_safety_score_snapshot,from_level,to_level,from_burden_ratio,to_burden_ratio,to_coverage_ratio,auto_eligible,review_decision,review_notes,reviewed_by,reviewed_at) FROM 'etl/phase3/decisions/phase3_swap_activation_review_v1.csv' WITH (FORMAT csv, HEADER true)

CREATE TEMP TABLE mvp_rules ON COMMIT DROP AS
SELECT
  r.swap_rule_id,
  r.rule_kind,
  r.status,
  p_from.priority_rank AS from_priority_rank,
  p_to.priority_rank AS to_priority_rank,
  sc.scoring_version,
  sc.fodmap_safety_score,
  sc.flavor_match_score,
  sc.texture_match_score,
  sc.method_match_score,
  sc.availability_fr_score,
  sc.cost_fr_score,
  sc.overall_score
FROM swap_rules r
JOIN swap_rule_scores sc ON sc.swap_rule_id = r.swap_rule_id
JOIN sources src ON src.source_id = r.source_id
JOIN phase2_priority_foods p_from ON p_from.resolved_food_id = r.from_food_id
JOIN phase2_priority_foods p_to ON p_to.resolved_food_id = r.to_food_id
WHERE src.source_slug = 'internal_rules_v1'
  AND r.notes = 'phase3_mvp_rule';

CREATE TEMP TABLE live_eval ON COMMIT DROP AS
WITH mapped_rules AS (
  SELECT
    e.rule_key,
    m.swap_rule_id,
    m.from_priority_rank,
    m.to_priority_rank,
    m.status,
    m.scoring_version,
    m.fodmap_safety_score,
    m.overall_score
  FROM mvp_rules m
  JOIN expected_rules e
    ON e.from_priority_rank = m.from_priority_rank
   AND e.to_priority_rank = m.to_priority_rank
   AND e.rule_kind = m.rule_kind
),
endpoints AS (
  SELECT
    mr.*,
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
)
SELECT
  s.rule_key,
  s.swap_rule_id,
  s.from_priority_rank,
  s.to_priority_rank,
  s.status,
  s.scoring_version,
  s.fodmap_safety_score,
  s.overall_score,
  s.from_level,
  s.to_level,
  s.from_burden_ratio,
  s.to_burden_ratio,
  CASE
    WHEN s.from_severity IS NULL OR s.to_severity IS NULL THEN FALSE
    WHEN s.from_burden_ratio IS NULL OR s.to_burden_ratio IS NULL THEN FALSE
    WHEN s.to_severity > s.from_severity THEN FALSE
    WHEN s.to_burden_ratio > s.from_burden_ratio THEN FALSE
    WHEN s.fodmap_safety_score < 0.500 THEN FALSE
    ELSE TRUE
  END AS conservative_eligible
FROM severity s;

DO $$
DECLARE
  bad_count INTEGER;
  active_count INTEGER;
  draft_count INTEGER;
  approve_count INTEGER;
  reject_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count FROM stg_review;
  IF bad_count <> 12 THEN
    RAISE EXCEPTION 'review CSV row count failed: expected 12, got %', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count FROM mvp_rules;
  IF bad_count <> 12 THEN
    RAISE EXCEPTION 'MVP rules row count failed: expected 12, got %', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM swap_rule_contexts c
  JOIN mvp_rules m ON m.swap_rule_id = c.swap_rule_id;
  IF bad_count <> 12 THEN
    RAISE EXCEPTION 'MVP context row count failed: expected 12, got %', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM swap_rule_scores s
  JOIN mvp_rules m ON m.swap_rule_id = s.swap_rule_id;
  IF bad_count <> 12 THEN
    RAISE EXCEPTION 'MVP score row count failed: expected 12, got %', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM live_eval
  WHERE scoring_version <> 'v2_full_rollup_2026_02_18';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'scoring_version failed: % MVP rows not on v2_full_rollup_2026_02_18', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM live_eval
  WHERE fodmap_safety_score < 0 OR fodmap_safety_score > 1
     OR overall_score < 0 OR overall_score > 1;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'score bounds failed on % MVP rows', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM live_eval l
  JOIN phase2_priority_foods pf ON pf.priority_rank = l.from_priority_rank
  JOIN phase2_priority_foods pt ON pt.priority_rank = l.to_priority_rank
  WHERE pf.priority_rank = 2 OR pt.priority_rank = 2;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'rank2 exclusion failed: % MVP rules touch rank2', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM live_eval
  WHERE status = 'active'
    AND conservative_eligible = FALSE;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'active-rule safety gate failed on % rows', bad_count;
  END IF;

  SELECT COUNT(*) INTO active_count FROM live_eval WHERE status = 'active';
  SELECT COUNT(*) INTO draft_count FROM live_eval WHERE status = 'draft';
  SELECT COUNT(*) INTO approve_count FROM stg_review WHERE review_decision = 'approve';
  SELECT COUNT(*) INTO reject_count FROM stg_review WHERE review_decision = 'reject';

  IF active_count <> approve_count THEN
    RAISE EXCEPTION 'status/decision mismatch: active=% approve=%', active_count, approve_count;
  END IF;

  IF draft_count <> reject_count THEN
    RAISE EXCEPTION 'status/decision mismatch: draft=% reject=%', draft_count, reject_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_review s
  JOIN live_eval l USING (rule_key)
  WHERE (s.review_decision = 'approve' AND l.status <> 'active')
     OR (s.review_decision = 'reject' AND l.status <> 'draft');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'status rows do not align with review CSV decisions on % rows', bad_count;
  END IF;
END $$;

SELECT
  rule_key,
  from_priority_rank,
  to_priority_rank,
  status,
  from_level,
  to_level,
  ROUND(from_burden_ratio::NUMERIC, 3) AS from_burden,
  ROUND(to_burden_ratio::NUMERIC, 3) AS to_burden,
  fodmap_safety_score,
  overall_score,
  conservative_eligible
FROM live_eval
ORDER BY rule_key;

COMMIT;
