\set ON_ERROR_STOP on

BEGIN;

-- Phase 3.4 Batch02 hard checks.

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

CREATE TEMP TABLE batch_rules ON COMMIT DROP AS
SELECT
  s.rule_key,
  s.from_priority_rank,
  s.to_priority_rank,
  r.swap_rule_id,
  r.status,
  sc.scoring_version,
  sc.fodmap_safety_score,
  sc.flavor_match_score,
  sc.texture_match_score,
  sc.method_match_score,
  sc.availability_fr_score,
  sc.cost_fr_score,
  sc.overall_score
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
WITH endpoints AS (
  SELECT
    br.rule_key,
    br.status,
    br.scoring_version,
    br.fodmap_safety_score,
    br.overall_score,
    br.from_priority_rank,
    br.to_priority_rank,
    vf.overall_level AS from_level,
    vt.overall_level AS to_level,
    vf.driver_subtype_code AS from_driver_subtype,
    vt.driver_subtype_code AS to_driver_subtype
  FROM batch_rules br
  JOIN v_phase3_rollups_latest_full vf ON vf.priority_rank = br.from_priority_rank
  JOIN v_phase3_rollups_latest_full vt ON vt.priority_rank = br.to_priority_rank
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
  b.*,
  CASE
    WHEN b.from_severity IS NULL OR b.to_severity IS NULL THEN FALSE
    WHEN b.from_driver_subtype IS NULL OR b.to_driver_subtype IS NULL THEN FALSE
    WHEN b.from_driver_subtype <> b.to_driver_subtype THEN FALSE
    WHEN b.from_burden_ratio IS NULL OR b.to_burden_ratio IS NULL THEN FALSE
    WHEN b.to_severity > b.from_severity THEN FALSE
    WHEN b.to_burden_ratio > b.from_burden_ratio THEN FALSE
    WHEN b.fodmap_safety_score < 0.500 THEN FALSE
    ELSE TRUE
  END AS conservative_eligible
FROM burdens b;

DO $$
DECLARE
  generated_count INTEGER;
  review_count INTEGER;
  db_count INTEGER;
  active_count INTEGER;
  draft_count INTEGER;
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO generated_count FROM stg_generated;
  IF generated_count < 1 OR generated_count > 40 THEN
    RAISE EXCEPTION 'Batch02 generated row count must be within 1..40, got %', generated_count;
  END IF;

  SELECT COUNT(*) INTO review_count FROM stg_review;
  IF review_count <> generated_count THEN
    RAISE EXCEPTION 'Batch02 review row count (%) must equal generated row count (%)', review_count, generated_count;
  END IF;

  SELECT COUNT(*) INTO db_count FROM batch_rules;
  IF db_count <> generated_count THEN
    RAISE EXCEPTION 'Batch02 DB scoped row count (%) must equal generated row count (%)', db_count, generated_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_generated
  WHERE from_priority_rank = 2 OR to_priority_rank = 2;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'rank2 exclusion failed in generated file';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM batch_rules b
  JOIN phase2_priority_foods pf ON pf.priority_rank = b.from_priority_rank
  JOIN phase2_priority_foods pt ON pt.priority_rank = b.to_priority_rank
  WHERE pf.priority_rank = 2 OR pt.priority_rank = 2;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'rank2 exclusion failed in batch DB scope';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT from_priority_rank, to_priority_rank
    FROM stg_generated
    GROUP BY from_priority_rank, to_priority_rank
    HAVING COUNT(*) > 1
  ) dup;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'duplicate from/to rows in generated file';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT from_priority_rank
    FROM stg_generated
    GROUP BY from_priority_rank
    HAVING COUNT(*) > 5
  ) capped;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'per-from cap failed in generated file';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT to_priority_rank
    FROM stg_generated
    GROUP BY to_priority_rank
    HAVING COUNT(*) > 5
  ) capped;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'per-to cap failed in generated file';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_generated
  WHERE from_driver_subtype IS NULL
     OR to_driver_subtype IS NULL
     OR from_driver_subtype <> to_driver_subtype;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'same-subtype direct_swap hard gate failed in generated file';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_generated g
  JOIN phase2_priority_foods pf ON pf.priority_rank = g.from_priority_rank
  JOIN phase2_priority_foods pt ON pt.priority_rank = g.to_priority_rank
  JOIN swap_rules r
   ON r.from_food_id = pf.resolved_food_id
   AND r.to_food_id = pt.resolved_food_id
   AND r.rule_kind = g.rule_kind
   AND (r.valid_to IS NULL OR r.valid_to >= CURRENT_DATE)
   AND NOT (
     COALESCE(r.notes, '') = 'phase3_batch02_rule'
     AND r.valid_from = DATE '2026-02-19'
   );
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'generated scope collides with exact open-validity non-batch02 rules in % rows', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_generated g
  JOIN phase2_priority_foods pf ON pf.priority_rank = g.from_priority_rank
  JOIN phase2_priority_foods pt ON pt.priority_rank = g.to_priority_rank
  JOIN swap_rules r
    ON r.from_food_id = pt.resolved_food_id
   AND r.to_food_id = pf.resolved_food_id
   AND r.rule_kind = g.rule_kind
   AND (r.valid_to IS NULL OR r.valid_to >= CURRENT_DATE)
   AND NOT (
     COALESCE(r.notes, '') = 'phase3_batch02_rule'
     AND r.valid_from = DATE '2026-02-19'
   );
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'generated scope collides with reverse open-validity non-batch02 rules in % rows', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM live_eval
  WHERE status = 'active'
    AND conservative_eligible = FALSE;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'active row failed conservative gate in % rows', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_review s
  JOIN live_eval l USING (rule_key)
  WHERE s.scoring_version_snapshot IS DISTINCT FROM l.scoring_version
     OR s.fodmap_safety_score_snapshot IS DISTINCT FROM l.fodmap_safety_score
     OR s.from_driver_subtype IS DISTINCT FROM l.from_driver_subtype
     OR s.to_driver_subtype IS DISTINCT FROM l.to_driver_subtype;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'snapshot lock mismatch in % rows', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM batch_rules
  WHERE scoring_version <> 'v2_full_rollup_2026_02_19_batch02';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'batch02 scoring_version mismatch in % rows', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM batch_rules
  WHERE fodmap_safety_score < 0 OR fodmap_safety_score > 1
     OR flavor_match_score < 0 OR flavor_match_score > 1
     OR texture_match_score < 0 OR texture_match_score > 1
     OR method_match_score < 0 OR method_match_score > 1
     OR availability_fr_score < 0 OR availability_fr_score > 1
     OR cost_fr_score < 0 OR cost_fr_score > 1
     OR overall_score < 0 OR overall_score > 1;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'score bounds failed in % rows', bad_count;
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
    RAISE EXCEPTION 'second-review completeness failed in % approved rows', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_review
  WHERE second_review_required = TRUE
    AND review_decision = 'approve'
    AND LOWER(BTRIM(second_reviewed_by)) = LOWER(BTRIM(reviewed_by));
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'second-review identity rule failed in % approved rows (same reviewer detected)', bad_count;
  END IF;

  SELECT COUNT(*) INTO active_count FROM batch_rules WHERE status = 'active';
  SELECT COUNT(*) INTO draft_count FROM batch_rules WHERE status = 'draft';

  IF active_count + draft_count <> generated_count THEN
    RAISE EXCEPTION 'status accounting mismatch for batch02 rules';
  END IF;
END $$;

SELECT
  COUNT(*) AS batch_rows,
  COUNT(*) FILTER (WHERE status = 'active') AS active_rows,
  COUNT(*) FILTER (WHERE status = 'draft') AS draft_rows,
  COUNT(*) FILTER (WHERE conservative_eligible) AS conservative_eligible_rows,
  MIN(fodmap_safety_score) AS min_fodmap_score,
  MAX(fodmap_safety_score) AS max_fodmap_score
FROM live_eval;

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
ORDER BY fodmap_safety_score DESC, overall_score DESC, rule_key;

COMMIT;
