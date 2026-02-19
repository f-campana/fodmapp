\set ON_ERROR_STOP on

BEGIN;

-- Phase 3 SQL MVP: seed 12 draft swap rules + contexts + scores.

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
  cost_fr_score NUMERIC(4,3)
) ON COMMIT DROP;

\copy stg_rules (rule_key,from_priority_rank,to_priority_rank,rule_kind,instruction_fr,instruction_en,min_ratio,max_ratio,default_ratio,evidence_tier,confidence_score,valid_from,status,notes,context_cooking_methods,context_dish_roles,context_cuisines,excluded_priority_ranks,fodmap_safety_score,flavor_match_score,texture_match_score,method_match_score,availability_fr_score,cost_fr_score) FROM 'etl/phase3/data/phase3_swap_rules_mvp_v1.csv' WITH (FORMAT csv, HEADER true)

DO $$
DECLARE
  bad_count INTEGER;
  from_amt NUMERIC;
  to_amt NUMERIC;
BEGIN
  SELECT COUNT(*) INTO bad_count FROM stg_rules;
  IF bad_count <> 12 THEN
    RAISE EXCEPTION 'expected 12 swap rules, got %', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT rule_key FROM stg_rules
    EXCEPT
    SELECT rule_key FROM expected_rules
  ) extra;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_rules contains unknown rule_key values';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT rule_key FROM expected_rules
    EXCEPT
    SELECT rule_key FROM stg_rules
  ) missing;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_rules missing required rule_key values';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules s
  JOIN expected_rules e USING (rule_key)
  WHERE s.from_priority_rank <> e.from_priority_rank
     OR s.to_priority_rank <> e.to_priority_rank
     OR s.rule_kind <> e.rule_kind;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'rule mapping mismatch against locked expected set';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules
  WHERE status <> 'draft';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'all MVP rules must be draft';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules
  WHERE from_priority_rank = 2 OR to_priority_rank = 2;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'rank2 is excluded from MVP swap rule graph';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules
  WHERE rule_kind NOT IN ('direct_swap', 'technique_swap', 'pairing_swap', 'recipe_rewrite');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'invalid rule_kind in stg_rules';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules
  WHERE evidence_tier NOT IN ('primary_lab', 'secondary_db', 'inferred');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'invalid evidence_tier in stg_rules';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules
  WHERE instruction_fr IS NULL OR instruction_fr = '';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'instruction_fr is required for all rules';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_rules
  WHERE min_ratio <= 0 OR max_ratio <= 0 OR default_ratio <= 0
     OR min_ratio > default_ratio OR default_ratio > max_ratio;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'ratio constraints invalid in stg_rules';
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
    RAISE EXCEPTION 'score ranges must be within [0,1]';
  END IF;

  -- From/to ranks must exist and be resolved; to-rank must be threshold_set.
  SELECT COUNT(*) INTO bad_count
  FROM stg_rules s
  LEFT JOIN phase2_priority_foods p_from ON p_from.priority_rank = s.from_priority_rank
  LEFT JOIN phase2_priority_foods p_to   ON p_to.priority_rank = s.to_priority_rank
  WHERE p_from.priority_rank IS NULL
     OR p_to.priority_rank IS NULL
     OR p_from.resolved_food_id IS NULL
     OR p_to.resolved_food_id IS NULL
     OR p_to.status <> 'threshold_set';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'from/to priority ranks must resolve; to_priority_rank must be threshold_set';
  END IF;

  -- Additional locked check for R10: target-subtype serving burden must decrease or stay equal.
  SELECT m.amount_g_per_serving
  INTO from_amt
  FROM phase2_priority_foods p
  JOIN fodmap_subtypes fst ON fst.code = p.target_subtype
  JOIN LATERAL (
    SELECT amount_g_per_serving
    FROM food_fodmap_measurements ffm
    WHERE ffm.food_id = p.resolved_food_id
      AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
      AND ffm.is_current = TRUE
    ORDER BY ffm.observed_at DESC, ffm.measurement_id DESC
    LIMIT 1
  ) m ON TRUE
  WHERE p.priority_rank = 28;

  SELECT m.amount_g_per_serving
  INTO to_amt
  FROM phase2_priority_foods p
  JOIN fodmap_subtypes fst ON fst.code = p.target_subtype
  JOIN LATERAL (
    SELECT amount_g_per_serving
    FROM food_fodmap_measurements ffm
    WHERE ffm.food_id = p.resolved_food_id
      AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
      AND ffm.is_current = TRUE
    ORDER BY ffm.observed_at DESC, ffm.measurement_id DESC
    LIMIT 1
  ) m ON TRUE
  WHERE p.priority_rank = 29;

  IF from_amt IS NULL OR to_amt IS NULL OR to_amt > from_amt THEN
    RAISE EXCEPTION 'R10 safety lock failed: expected to.amount_per_serving <= from.amount_per_serving, got % <= %', to_amt, from_amt;
  END IF;
END $$;

CREATE TEMP TABLE phase3_source ON COMMIT DROP AS
SELECT source_id FROM sources WHERE source_slug = 'internal_rules_v1';

DO $$
DECLARE c INTEGER;
BEGIN
  SELECT COUNT(*) INTO c FROM phase3_source;
  IF c <> 1 THEN
    RAISE EXCEPTION 'source internal_rules_v1 must resolve to exactly one row, got %', c;
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
    'phase3_mvp_context'
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
    'v1',
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
  (SELECT COUNT(*) FROM inserted_context) AS context_rows,
  (SELECT COUNT(*) FROM upserted_scores) AS score_rows;

COMMIT;
