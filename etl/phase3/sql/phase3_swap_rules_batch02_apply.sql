\set ON_ERROR_STOP on

BEGIN;

-- Phase 3.4 Batch02: apply generated draft swap rules.

CREATE TEMP TABLE stg_rules (
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

\copy stg_rules (rule_key,from_priority_rank,to_priority_rank,rule_kind,instruction_fr,instruction_en,min_ratio,max_ratio,default_ratio,evidence_tier,confidence_score,valid_from,status,notes,context_cooking_methods,context_dish_roles,context_cuisines,excluded_priority_ranks,fodmap_safety_score,flavor_match_score,texture_match_score,method_match_score,availability_fr_score,cost_fr_score,ranking_score,from_overall_level,to_overall_level,from_burden_ratio,to_burden_ratio,to_coverage_ratio,from_driver_subtype,to_driver_subtype,from_root_category,to_root_category,allergen_change,second_review_required) FROM 'etl/phase3/data/phase3_swap_rules_batch02_generated_v1.csv' WITH (FORMAT csv, HEADER true)

DO $$
DECLARE
  row_count INTEGER;
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM stg_rules;
  IF row_count < 1 OR row_count > 40 THEN
    RAISE EXCEPTION 'Batch02 candidate count must be within 1..40, got %', row_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules
  WHERE from_priority_rank NOT BETWEEN 1 AND 42
     OR to_priority_rank NOT BETWEEN 1 AND 42;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Batch02 rows contain ranks outside 1..42';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules
  WHERE from_priority_rank = to_priority_rank;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Batch02 rows contain self-pairs';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules
  WHERE from_priority_rank = 2 OR to_priority_rank = 2;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Batch02 rank2 exclusion failed';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT from_priority_rank, to_priority_rank, rule_kind
    FROM stg_rules
    GROUP BY from_priority_rank, to_priority_rank, rule_kind
    HAVING COUNT(*) > 1
  ) dup;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Batch02 duplicate from/to/rule_kind rows detected';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules
  WHERE status <> 'draft';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Batch02 status must be draft for all rows';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules
  WHERE notes <> 'phase3_batch02_rule';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Batch02 notes must be phase3_batch02_rule';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules
  WHERE valid_from <> DATE '2026-02-19';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Batch02 valid_from must be locked to 2026-02-19';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules
  WHERE rule_kind <> 'direct_swap';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Batch02 rule_kind must be direct_swap for all rows';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules
  WHERE evidence_tier NOT IN ('primary_lab', 'secondary_db', 'inferred');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Batch02 contains invalid evidence_tier';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules
  WHERE instruction_fr IS NULL OR instruction_fr = '' OR instruction_en IS NULL OR instruction_en = '';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Batch02 instructions must be populated in both FR and EN';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules
  WHERE min_ratio <= 0
     OR max_ratio <= 0
     OR default_ratio <= 0
     OR min_ratio > default_ratio
     OR default_ratio > max_ratio;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Batch02 ratio constraints invalid';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules
  WHERE confidence_score < 0 OR confidence_score > 1
     OR fodmap_safety_score < 0 OR fodmap_safety_score > 1
     OR flavor_match_score < 0 OR flavor_match_score > 1
     OR texture_match_score < 0 OR texture_match_score > 1
     OR method_match_score < 0 OR method_match_score > 1
     OR availability_fr_score < 0 OR availability_fr_score > 1
     OR cost_fr_score < 0 OR cost_fr_score > 1;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Batch02 score values must be within [0,1]';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules
  WHERE from_driver_subtype IS NULL
     OR to_driver_subtype IS NULL
     OR from_driver_subtype <> to_driver_subtype;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Batch02 same-subtype direct_swap gate failed in staged rows';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules s
  LEFT JOIN phase2_priority_foods p_from ON p_from.priority_rank = s.from_priority_rank
  LEFT JOIN phase2_priority_foods p_to ON p_to.priority_rank = s.to_priority_rank
  WHERE p_from.priority_rank IS NULL
     OR p_to.priority_rank IS NULL
     OR p_from.resolved_food_id IS NULL
     OR p_to.resolved_food_id IS NULL
     OR p_to.status <> 'threshold_set';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Batch02 from/to ranks must resolve and target rows must be threshold_set';
  END IF;
END $$;

CREATE TEMP TABLE phase3_source ON COMMIT DROP AS
SELECT source_id
FROM sources
WHERE source_slug = 'internal_rules_v1';

DO $$
DECLARE
  source_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO source_count FROM phase3_source;
  IF source_count <> 1 THEN
    RAISE EXCEPTION 'source internal_rules_v1 must resolve to exactly one row, got %', source_count;
  END IF;
END $$;

WITH prepared AS (
  SELECT
    s.rule_key,
    p_from.resolved_food_id AS from_food_id,
    p_to.resolved_food_id AS to_food_id,
    s.rule_kind,
    s.instruction_fr,
    s.instruction_en,
    s.min_ratio,
    s.max_ratio,
    s.default_ratio,
    s.evidence_tier::evidence_tier AS evidence_tier,
    s.confidence_score,
    s.valid_from,
    s.status::swap_status AS status,
    s.notes,
    s.context_cooking_methods,
    s.context_dish_roles,
    s.context_cuisines,
    s.excluded_priority_ranks,
    s.fodmap_safety_score,
    s.flavor_match_score,
    s.texture_match_score,
    s.method_match_score,
    s.availability_fr_score,
    s.cost_fr_score
  FROM stg_rules s
  JOIN phase2_priority_foods p_from ON p_from.priority_rank = s.from_priority_rank
  JOIN phase2_priority_foods p_to ON p_to.priority_rank = s.to_priority_rank
),
upserted AS (
  INSERT INTO swap_rules (
    from_food_id,
    to_food_id,
    status,
    rule_kind,
    instruction_fr,
    instruction_en,
    min_ratio,
    max_ratio,
    default_ratio,
    source_id,
    evidence_tier,
    confidence_score,
    valid_from,
    notes
  )
  SELECT
    p.from_food_id,
    p.to_food_id,
    p.status,
    p.rule_kind,
    p.instruction_fr,
    p.instruction_en,
    p.min_ratio,
    p.max_ratio,
    p.default_ratio,
    src.source_id,
    p.evidence_tier,
    p.confidence_score,
    p.valid_from,
    p.notes
  FROM prepared p
  CROSS JOIN phase3_source src
  ON CONFLICT (from_food_id, to_food_id, rule_kind, valid_from)
  DO UPDATE SET
    status = EXCLUDED.status,
    instruction_fr = EXCLUDED.instruction_fr,
    instruction_en = EXCLUDED.instruction_en,
    min_ratio = EXCLUDED.min_ratio,
    max_ratio = EXCLUDED.max_ratio,
    default_ratio = EXCLUDED.default_ratio,
    source_id = EXCLUDED.source_id,
    evidence_tier = EXCLUDED.evidence_tier,
    confidence_score = EXCLUDED.confidence_score,
    notes = EXCLUDED.notes
  RETURNING swap_rule_id, from_food_id, to_food_id, rule_kind, valid_from
),
rule_map AS (
  SELECT
    p.rule_key,
    u.swap_rule_id,
    p.context_cooking_methods,
    p.context_dish_roles,
    p.context_cuisines,
    p.excluded_priority_ranks,
    p.fodmap_safety_score,
    p.flavor_match_score,
    p.texture_match_score,
    p.method_match_score,
    p.availability_fr_score,
    p.cost_fr_score
  FROM prepared p
  JOIN upserted u
    ON u.from_food_id = p.from_food_id
   AND u.to_food_id = p.to_food_id
   AND u.rule_kind = p.rule_kind
   AND u.valid_from = p.valid_from
),
deleted_context AS (
  DELETE FROM swap_rule_contexts c
  USING rule_map rm
  WHERE c.swap_rule_id = rm.swap_rule_id
  RETURNING c.swap_rule_id
),
inserted_context AS (
  INSERT INTO swap_rule_contexts (
    swap_rule_id,
    cooking_methods,
    dish_roles,
    cuisine_codes,
    excluded_food_ids,
    locale_country,
    season_months,
    notes
  )
  SELECT
    rm.swap_rule_id,
    COALESCE(string_to_array(NULLIF(rm.context_cooking_methods, ''), '|'), ARRAY[]::TEXT[]),
    COALESCE(string_to_array(NULLIF(rm.context_dish_roles, ''), '|'), ARRAY[]::TEXT[]),
    COALESCE(string_to_array(NULLIF(rm.context_cuisines, ''), '|'), ARRAY[]::TEXT[]),
    COALESCE((
      SELECT ARRAY_AGG(p.resolved_food_id)
      FROM phase2_priority_foods p
      WHERE NULLIF(rm.excluded_priority_ranks, '') IS NOT NULL
        AND p.priority_rank = ANY(string_to_array(rm.excluded_priority_ranks, '|')::INTEGER[])
    ), ARRAY[]::UUID[]),
    'FR',
    ARRAY[]::SMALLINT[],
    'phase3_batch02_context'
  FROM rule_map rm
  RETURNING swap_rule_id
),
upserted_scores AS (
  INSERT INTO swap_rule_scores (
    swap_rule_id,
    scoring_version,
    fodmap_safety_score,
    flavor_match_score,
    texture_match_score,
    method_match_score,
    availability_fr_score,
    cost_fr_score
  )
  SELECT
    rm.swap_rule_id,
    'v2_batch02_seed_2026_02_19',
    rm.fodmap_safety_score,
    rm.flavor_match_score,
    rm.texture_match_score,
    rm.method_match_score,
    rm.availability_fr_score,
    rm.cost_fr_score
  FROM rule_map rm
  ON CONFLICT (swap_rule_id)
  DO UPDATE SET
    scoring_version = EXCLUDED.scoring_version,
    fodmap_safety_score = EXCLUDED.fodmap_safety_score,
    flavor_match_score = EXCLUDED.flavor_match_score,
    texture_match_score = EXCLUDED.texture_match_score,
    method_match_score = EXCLUDED.method_match_score,
    availability_fr_score = EXCLUDED.availability_fr_score,
    cost_fr_score = EXCLUDED.cost_fr_score
  RETURNING swap_rule_id
)
SELECT
  (SELECT COUNT(*) FROM rule_map) AS rule_rows,
  (SELECT COUNT(*) FROM deleted_context) AS context_rows_replaced,
  (SELECT COUNT(*) FROM inserted_context) AS context_rows_inserted,
  (SELECT COUNT(*) FROM upserted_scores) AS score_rows;

COMMIT;
