\set ON_ERROR_STOP on

BEGIN;

-- Phase 3.1b Gate B:
-- Load reviewed decisions and activate eligible MVP swap rules.

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

\copy stg_review (rule_key,from_priority_rank,to_priority_rank,scoring_version_snapshot,fodmap_safety_score_snapshot,from_level,to_level,from_burden_ratio,to_burden_ratio,to_coverage_ratio,auto_eligible,review_decision,review_notes,reviewed_by,reviewed_at) FROM program 'sh -c "cat \"${PHASE3_REVIEW_CSV_PATH:-etl/phase3/decisions/phase3_swap_activation_review_v1.csv}\""' WITH (FORMAT csv, HEADER true)

CREATE TEMP TABLE mvp_rules ON COMMIT DROP AS
SELECT
  r.swap_rule_id,
  r.rule_kind,
  r.status,
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
  AND r.notes = 'phase3_mvp_rule';

DO $$
DECLARE
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count FROM stg_review;
  IF bad_count <> 12 THEN
    RAISE EXCEPTION 'review CSV must contain exactly 12 rows, got %', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count FROM mvp_rules;
  IF bad_count <> 12 THEN
    RAISE EXCEPTION 'expected 12 MVP rules in DB scope, got %', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT s.rule_key FROM stg_review s
    EXCEPT
    SELECT e.rule_key FROM expected_rules e
  ) extra;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'review CSV contains unknown rule_key values';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT e.rule_key FROM expected_rules e
    EXCEPT
    SELECT s.rule_key FROM stg_review s
  ) missing;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'review CSV missing required rule_key values';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_review s
  JOIN expected_rules e USING (rule_key)
  WHERE s.from_priority_rank <> e.from_priority_rank
     OR s.to_priority_rank <> e.to_priority_rank;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'review CSV rank mapping mismatch against locked rule set';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_review
  WHERE review_decision NOT IN ('approve', 'reject');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'review_decision must be approve/reject for all rows';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_review
  WHERE COALESCE(reviewed_by, '') = ''
     OR COALESCE(reviewed_at, '') = ''
     OR NOT pg_input_is_valid(reviewed_at, 'timestamp with time zone');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'reviewed_by/reviewed_at must be provided and reviewed_at must be valid timestamptz';
  END IF;
END $$;

CREATE TEMP TABLE live_eval ON COMMIT DROP AS
WITH mapped_rules AS (
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
)
SELECT
  s.rule_key,
  s.swap_rule_id,
  s.scoring_version,
  s.fodmap_safety_score,
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
  END AS auto_eligible
FROM severity s;

DO $$
DECLARE
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count
  FROM stg_review s
  JOIN live_eval l USING (rule_key)
  WHERE s.scoring_version_snapshot IS DISTINCT FROM l.scoring_version
     OR s.fodmap_safety_score_snapshot IS DISTINCT FROM l.fodmap_safety_score;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'snapshot lock failed on % rows (score/version drift)', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_review s
  JOIN live_eval l USING (rule_key)
  WHERE s.auto_eligible IS DISTINCT FROM l.auto_eligible;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'auto_eligible mismatch on % rows (review CSV is stale or edited incorrectly)', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_review s
  JOIN live_eval l USING (rule_key)
  WHERE s.review_decision = 'approve'
    AND l.auto_eligible = FALSE;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'conservative gate failed: approve decision present for ineligible rows';
  END IF;
END $$;

CREATE TEMP TABLE non_scope_status_before ON COMMIT DROP AS
SELECT r.swap_rule_id, r.status
FROM swap_rules r
WHERE r.swap_rule_id NOT IN (SELECT swap_rule_id FROM mvp_rules);

WITH decisions AS (
  SELECT
    l.swap_rule_id,
    CASE
      WHEN s.review_decision = 'approve' THEN 'active'::swap_status
      ELSE 'draft'::swap_status
    END AS new_status
  FROM stg_review s
  JOIN live_eval l USING (rule_key)
),
updated AS (
  UPDATE swap_rules r
  SET status = d.new_status
  FROM decisions d
  WHERE r.swap_rule_id = d.swap_rule_id
    AND r.status IS DISTINCT FROM d.new_status
  RETURNING r.swap_rule_id
)
SELECT
  (SELECT COUNT(*) FROM decisions) AS decision_rows,
  (SELECT COUNT(*) FROM updated) AS status_rows_updated,
  (SELECT COUNT(*) FROM stg_review WHERE review_decision = 'approve') AS approve_rows,
  (SELECT COUNT(*) FROM stg_review WHERE review_decision = 'reject') AS reject_rows;

DO $$
DECLARE
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count
  FROM non_scope_status_before b
  JOIN swap_rules r ON r.swap_rule_id = b.swap_rule_id
  WHERE r.status IS DISTINCT FROM b.status;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'scope lock failed: % non-MVP rules had status changes', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_review s
  JOIN live_eval l USING (rule_key)
  JOIN swap_rules r ON r.swap_rule_id = l.swap_rule_id
  WHERE (
    s.review_decision = 'approve' AND r.status <> 'active'
  ) OR (
    s.review_decision = 'reject' AND r.status <> 'draft'
  );
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'post-apply status mismatch on % reviewed rows', bad_count;
  END IF;
END $$;

SELECT
  e.rule_key,
  e.from_priority_rank,
  e.to_priority_rank,
  r.status,
  l.fodmap_safety_score,
  l.auto_eligible
FROM expected_rules e
JOIN live_eval l USING (rule_key)
JOIN swap_rules r ON r.swap_rule_id = l.swap_rule_id
ORDER BY e.rule_key;

COMMIT;
