\set ON_ERROR_STOP on

BEGIN;

-- Phase 3.4 Batch02 Gate B:
-- Apply reviewed decisions to Batch02 rules with snapshot and conservative locks.

CREATE TEMP TABLE stg_generated (
  rule_key TEXT,
  from_priority_rank INTEGER,
  to_priority_rank INTEGER,
  rule_kind TEXT,
  instruction_fr TEXT,
  instruction_en TEXT,
  min_ratio NUMERIC(8,3),
  max_ratio NUMERIC(8,3),
  default_ratio NUMERIC(8,3),
  evidence_tier TEXT,
  confidence_score NUMERIC(4,3),
  valid_from DATE,
  status TEXT,
  notes TEXT,
  context_cooking_methods TEXT,
  context_dish_roles TEXT,
  context_cuisines TEXT,
  excluded_priority_ranks TEXT,
  fodmap_safety_score NUMERIC(4,3),
  flavor_match_score NUMERIC(4,3),
  texture_match_score NUMERIC(4,3),
  method_match_score NUMERIC(4,3),
  availability_fr_score NUMERIC(4,3),
  cost_fr_score NUMERIC(4,3),
  ranking_score NUMERIC(5,3),
  from_overall_level TEXT,
  to_overall_level TEXT,
  from_burden_ratio NUMERIC,
  to_burden_ratio NUMERIC,
  to_coverage_ratio NUMERIC,
  from_driver_subtype TEXT,
  to_driver_subtype TEXT,
  from_root_category TEXT,
  to_root_category TEXT,
  allergen_change BOOLEAN,
  second_review_required BOOLEAN
) ON COMMIT DROP;

\copy stg_generated (rule_key,from_priority_rank,to_priority_rank,rule_kind,instruction_fr,instruction_en,min_ratio,max_ratio,default_ratio,evidence_tier,confidence_score,valid_from,status,notes,context_cooking_methods,context_dish_roles,context_cuisines,excluded_priority_ranks,fodmap_safety_score,flavor_match_score,texture_match_score,method_match_score,availability_fr_score,cost_fr_score,ranking_score,from_overall_level,to_overall_level,from_burden_ratio,to_burden_ratio,to_coverage_ratio,from_driver_subtype,to_driver_subtype,from_root_category,to_root_category,allergen_change,second_review_required) FROM 'etl/phase3/data/phase3_swap_rules_batch02_generated_v1.csv' WITH (FORMAT csv, HEADER true)

CREATE TEMP TABLE stg_allergens (
  priority_rank INTEGER,
  food_slug TEXT,
  allergen_family_code TEXT
) ON COMMIT DROP;

\copy stg_allergens (priority_rank,food_slug,allergen_family_code) FROM 'etl/phase3/data/phase3_food_allergen_families_v1.csv' WITH (FORMAT csv, HEADER true)

CREATE TEMP TABLE stg_review (
  rule_key TEXT,
  from_priority_rank INTEGER,
  to_priority_rank INTEGER,
  scoring_version_snapshot TEXT,
  fodmap_safety_score_snapshot NUMERIC(4,3),
  from_level fodmap_level,
  to_level fodmap_level,
  from_driver_subtype TEXT,
  to_driver_subtype TEXT,
  from_burden_ratio NUMERIC,
  to_burden_ratio NUMERIC,
  to_coverage_ratio NUMERIC,
  auto_eligible BOOLEAN,
  second_review_required BOOLEAN,
  review_decision TEXT,
  review_reason_code TEXT,
  review_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  second_review_decision TEXT,
  second_reviewed_by TEXT,
  second_reviewed_at TEXT
) ON COMMIT DROP;

\copy stg_review (rule_key,from_priority_rank,to_priority_rank,scoring_version_snapshot,fodmap_safety_score_snapshot,from_level,to_level,from_driver_subtype,to_driver_subtype,from_burden_ratio,to_burden_ratio,to_coverage_ratio,auto_eligible,second_review_required,review_decision,review_reason_code,review_notes,reviewed_by,reviewed_at,second_review_decision,second_reviewed_by,second_reviewed_at) FROM 'etl/phase3/decisions/phase3_swap_batch02_review_v1.csv' WITH (FORMAT csv, HEADER true)

DO $$
DECLARE
  generated_count INTEGER;
  review_count INTEGER;
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO generated_count FROM stg_generated;
  SELECT COUNT(*) INTO review_count FROM stg_review;

  IF generated_count < 1 OR generated_count > 40 THEN
    RAISE EXCEPTION 'generated scope must contain 1..40 rows, got %', generated_count;
  END IF;

  IF review_count <> generated_count THEN
    RAISE EXCEPTION 'review CSV row count (%) must match generated row count (%)', review_count, generated_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT rule_key FROM stg_review
    EXCEPT
    SELECT rule_key FROM stg_generated
  ) extra;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'review CSV contains unknown rule keys';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT rule_key FROM stg_generated
    EXCEPT
    SELECT rule_key FROM stg_review
  ) missing;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'review CSV missing generated rule keys';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_review
  WHERE review_decision NOT IN ('approve', 'reject', 'defer');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'review_decision must be approve/reject/defer';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_generated
  WHERE from_driver_subtype IS NULL
     OR to_driver_subtype IS NULL
     OR from_driver_subtype <> to_driver_subtype;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'same-subtype direct_swap hard gate failed in generated scope';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_review
  WHERE COALESCE(reviewed_by, '') = ''
     OR COALESCE(reviewed_at, '') = ''
     OR NOT pg_input_is_valid(reviewed_at, 'timestamp with time zone');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'reviewed_by/reviewed_at required and reviewed_at must be valid timestamptz';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_review
  WHERE review_decision IN ('reject', 'defer')
    AND COALESCE(review_reason_code, '') = '';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'review_reason_code is required for reject/defer rows';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_review
  WHERE second_review_required = TRUE
    AND review_decision = 'approve'
    AND (
      second_review_decision <> 'approve'
      OR COALESCE(second_reviewed_by, '') = ''
      OR COALESCE(second_reviewed_at, '') = ''
      OR NOT pg_input_is_valid(second_reviewed_at, 'timestamp with time zone')
    );
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'second review metadata is required for approved rows flagged second_review_required';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_review
  WHERE second_review_required = TRUE
    AND review_decision = 'approve'
    AND LOWER(BTRIM(second_reviewed_by)) = LOWER(BTRIM(reviewed_by));
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'second-review identity rule failed: second reviewer must differ from first reviewer on approved second-review rows';
  END IF;
END $$;

CREATE TEMP TABLE batch_rules ON COMMIT DROP AS
SELECT
  s.rule_key,
  s.from_priority_rank,
  s.to_priority_rank,
  r.swap_rule_id,
  sc.scoring_version,
  sc.fodmap_safety_score
FROM stg_generated s
JOIN sources src ON src.source_slug = 'internal_rules_v1'
JOIN phase2_priority_foods p_from ON p_from.priority_rank = s.from_priority_rank
JOIN phase2_priority_foods p_to ON p_to.priority_rank = s.to_priority_rank
JOIN swap_rules r
  ON r.from_food_id = p_from.resolved_food_id
 AND r.to_food_id = p_to.resolved_food_id
 AND r.rule_kind = s.rule_kind
 AND r.valid_from = s.valid_from
 AND r.notes = s.notes
 AND r.source_id = src.source_id
JOIN swap_rule_scores sc ON sc.swap_rule_id = r.swap_rule_id;

CREATE TEMP TABLE live_eval ON COMMIT DROP AS
WITH allergen_sets AS (
  SELECT
    priority_rank,
    COALESCE(
      ARRAY_AGG(allergen_family_code ORDER BY allergen_family_code) FILTER (WHERE allergen_family_code <> 'none'),
      ARRAY[]::TEXT[]
    ) AS allergen_set
  FROM stg_allergens
  GROUP BY priority_rank
),
category_root AS (
  WITH RECURSIVE cat_tree AS (
    SELECT category_id, parent_category_id, code, code AS root_code
    FROM food_categories
    WHERE parent_category_id IS NULL
    UNION ALL
    SELECT fc.category_id, fc.parent_category_id, fc.code, ct.root_code
    FROM food_categories fc
    JOIN cat_tree ct ON fc.parent_category_id = ct.category_id
  )
  SELECT * FROM cat_tree
),
endpoints AS (
  SELECT
    br.rule_key,
    br.swap_rule_id,
    br.scoring_version,
    br.fodmap_safety_score,
    br.from_priority_rank,
    br.to_priority_rank,
    vf.overall_level AS from_level,
    vt.overall_level AS to_level,
    vf.coverage_ratio AS from_coverage_ratio,
    vt.coverage_ratio AS to_coverage_ratio,
    vf.driver_subtype_code AS from_driver_subtype,
    vt.driver_subtype_code AS to_driver_subtype,
    COALESCE((
      SELECT cr.root_code
      FROM phase2_priority_foods p
      JOIN food_category_memberships m ON m.food_id = p.resolved_food_id
      JOIN category_root cr ON cr.category_id = m.category_id
      WHERE p.priority_rank = br.from_priority_rank
      ORDER BY m.is_primary DESC, m.category_id DESC
      LIMIT 1
    ), 'uncategorized') AS from_root_category,
    COALESCE((
      SELECT cr.root_code
      FROM phase2_priority_foods p
      JOIN food_category_memberships m ON m.food_id = p.resolved_food_id
      JOIN category_root cr ON cr.category_id = m.category_id
      WHERE p.priority_rank = br.to_priority_rank
      ORDER BY m.is_primary DESC, m.category_id DESC
      LIMIT 1
    ), 'uncategorized') AS to_root_category,
    af.allergen_set AS from_allergen_set,
    at.allergen_set AS to_allergen_set
  FROM batch_rules br
  JOIN v_phase3_rollups_latest_full vf ON vf.priority_rank = br.from_priority_rank
  JOIN v_phase3_rollups_latest_full vt ON vt.priority_rank = br.to_priority_rank
  JOIN allergen_sets af ON af.priority_rank = br.from_priority_rank
  JOIN allergen_sets at ON at.priority_rank = br.to_priority_rank
),
burdens AS (
  SELECT
    e.*,
    fd.burden_ratio AS from_burden_ratio,
    td.burden_ratio AS to_burden_ratio,
    CASE e.from_level
      WHEN 'none'::fodmap_level THEN 0
      WHEN 'low'::fodmap_level THEN 1
      WHEN 'moderate'::fodmap_level THEN 2
      WHEN 'high'::fodmap_level THEN 3
      ELSE NULL
    END AS from_severity,
    CASE e.to_level
      WHEN 'none'::fodmap_level THEN 0
      WHEN 'low'::fodmap_level THEN 1
      WHEN 'moderate'::fodmap_level THEN 2
      WHEN 'high'::fodmap_level THEN 3
      ELSE NULL
    END AS to_severity
  FROM endpoints e
  LEFT JOIN v_phase3_rollup_subtype_levels_latest fd
    ON fd.priority_rank = e.from_priority_rank
   AND fd.subtype_code = e.from_driver_subtype
  LEFT JOIN v_phase3_rollup_subtype_levels_latest td
    ON td.priority_rank = e.to_priority_rank
   AND td.subtype_code = e.to_driver_subtype
)
SELECT
  b.rule_key,
  b.swap_rule_id,
  b.scoring_version,
  b.fodmap_safety_score,
  b.from_level,
  b.to_level,
  b.from_driver_subtype,
  b.to_driver_subtype,
  b.from_burden_ratio,
  b.to_burden_ratio,
  b.to_coverage_ratio,
  (b.from_root_category <> b.to_root_category) AS cross_category,
  (b.from_allergen_set <> b.to_allergen_set) AS allergen_change,
  CASE
    WHEN b.from_severity IS NULL OR b.to_severity IS NULL THEN FALSE
    WHEN b.from_driver_subtype IS NULL OR b.to_driver_subtype IS NULL THEN FALSE
    WHEN b.from_driver_subtype <> b.to_driver_subtype THEN FALSE
    WHEN b.from_burden_ratio IS NULL OR b.to_burden_ratio IS NULL THEN FALSE
    WHEN b.to_severity > b.from_severity THEN FALSE
    WHEN b.to_burden_ratio > b.from_burden_ratio THEN FALSE
    WHEN b.fodmap_safety_score < 0.500 THEN FALSE
    ELSE TRUE
  END AS auto_eligible,
  (
    b.to_coverage_ratio < 0.50
    OR b.fodmap_safety_score < 0.60
    OR (b.from_root_category <> b.to_root_category)
    OR (b.from_allergen_set <> b.to_allergen_set)
  ) AS second_review_required
FROM burdens b;

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
    RAISE EXCEPTION 'snapshot lock failed on % rows', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_review s
  JOIN live_eval l USING (rule_key)
  WHERE s.from_driver_subtype IS DISTINCT FROM l.from_driver_subtype
     OR s.to_driver_subtype IS DISTINCT FROM l.to_driver_subtype
     OR s.auto_eligible IS DISTINCT FROM l.auto_eligible
     OR s.second_review_required IS DISTINCT FROM l.second_review_required;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'review CSV eligibility metadata drift detected on % rows', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_review s
  JOIN live_eval l USING (rule_key)
  WHERE s.review_decision = 'approve'
    AND l.auto_eligible = FALSE;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'approve decisions found on ineligible rows';
  END IF;
END $$;

CREATE TEMP TABLE non_scope_status_before ON COMMIT DROP AS
SELECT r.swap_rule_id, r.status
FROM swap_rules r
WHERE r.swap_rule_id NOT IN (SELECT swap_rule_id FROM batch_rules);

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
  (SELECT COUNT(*) FROM decisions WHERE new_status = 'active') AS target_active_rows,
  (SELECT COUNT(*) FROM decisions WHERE new_status = 'draft') AS target_draft_rows,
  (SELECT COUNT(*) FROM updated) AS status_rows_updated;

DO $$
DECLARE
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count
  FROM non_scope_status_before b
  JOIN swap_rules r USING (swap_rule_id)
  WHERE r.status IS DISTINCT FROM b.status;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'scope lock failed: non-batch rule status changed on % rows', bad_count;
  END IF;
END $$;

COMMIT;
