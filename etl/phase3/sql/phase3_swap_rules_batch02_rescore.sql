\set ON_ERROR_STOP on

BEGIN;

-- Phase 3.4 Batch02 Gate A:
-- Re-score batch rules against current full-rollup state and export review packet.

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

DO $$
DECLARE
  bad_count INTEGER;
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM stg_generated;
  IF row_count < 1 OR row_count > 40 THEN
    RAISE EXCEPTION 'Batch02 generated file must contain 1..40 rows, got %', row_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_generated
  WHERE notes <> 'phase3_batch02_rule'
     OR valid_from <> DATE '2026-02-19';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Batch02 generated file contains non-batch02 scope rows';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_generated
  WHERE from_priority_rank = 2 OR to_priority_rank = 2;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'rank2 exclusion failed in batch02 generated scope';
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
  FROM (
    SELECT rule_key
    FROM stg_generated
    GROUP BY rule_key
    HAVING COUNT(*) > 1
  ) dup;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'duplicate rule_key values in batch02 generated scope';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_generated s
  LEFT JOIN swap_rules r
    ON r.rule_kind = s.rule_kind
   AND r.valid_from = s.valid_from
   AND r.notes = s.notes
   AND r.source_id = (SELECT source_id FROM sources WHERE source_slug = 'internal_rules_v1')
   AND r.from_food_id = (SELECT p.resolved_food_id FROM phase2_priority_foods p WHERE p.priority_rank = s.from_priority_rank)
   AND r.to_food_id = (SELECT p.resolved_food_id FROM phase2_priority_foods p WHERE p.priority_rank = s.to_priority_rank)
  WHERE r.swap_rule_id IS NULL;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'batch02 DB scope missing one or more generated rules';
  END IF;
END $$;

CREATE TEMP TABLE batch_rules ON COMMIT DROP AS
SELECT
  s.rule_key,
  s.from_priority_rank,
  s.to_priority_rank,
  r.swap_rule_id,
  sc.flavor_match_score,
  sc.texture_match_score,
  sc.method_match_score,
  sc.availability_fr_score,
  sc.cost_fr_score
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

CREATE TEMP TABLE rescore_snapshot ON COMMIT DROP AS
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
endpoints AS (
  SELECT
    br.rule_key,
    br.swap_rule_id,
    br.from_priority_rank,
    br.to_priority_rank,
    vf.overall_level AS from_level,
    vt.overall_level AS to_level,
    vf.coverage_ratio AS from_coverage_ratio,
    vt.coverage_ratio AS to_coverage_ratio,
    vf.driver_subtype_code AS from_driver_subtype,
    vt.driver_subtype_code AS to_driver_subtype,
    COALESCE((
      SELECT ct.root_code
      FROM phase2_priority_foods p
      JOIN food_category_memberships m ON m.food_id = p.resolved_food_id
      JOIN (
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
      ) ct ON ct.category_id = m.category_id
      WHERE p.priority_rank = br.from_priority_rank
      ORDER BY m.is_primary DESC, m.category_id DESC
      LIMIT 1
    ), 'uncategorized') AS from_root_category,
    COALESCE((
      SELECT ct.root_code
      FROM phase2_priority_foods p
      JOIN food_category_memberships m ON m.food_id = p.resolved_food_id
      JOIN (
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
      ) ct ON ct.category_id = m.category_id
      WHERE p.priority_rank = br.to_priority_rank
      ORDER BY m.is_primary DESC, m.category_id DESC
      LIMIT 1
    ), 'uncategorized') AS to_root_category,
    af.allergen_set AS from_allergen_set,
    at.allergen_set AS to_allergen_set,
    br.flavor_match_score,
    br.texture_match_score,
    br.method_match_score,
    br.availability_fr_score,
    br.cost_fr_score
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
),
scored AS (
  SELECT
    b.*,
    CASE
      WHEN b.from_severity IS NULL OR b.to_severity IS NULL THEN NULL
      WHEN (b.from_severity - b.to_severity) >= 2 THEN 0.95
      WHEN (b.from_severity - b.to_severity) = 1 THEN 0.80
      WHEN (b.from_severity - b.to_severity) = 0 THEN 0.60
      ELSE 0.00
    END AS level_score,
    CASE
      WHEN b.from_severity IS NULL OR b.to_severity IS NULL THEN NULL
      WHEN b.from_burden_ratio IS NULL OR b.to_burden_ratio IS NULL THEN 0.50
      WHEN b.from_burden_ratio <= 0 AND b.to_burden_ratio <= 0 THEN 1.00
      WHEN b.from_burden_ratio <= 0 AND b.to_burden_ratio > 0 THEN 0.00
      ELSE GREATEST(
        0.00,
        LEAST(1.00, 0.50 + ((b.from_burden_ratio - b.to_burden_ratio) / b.from_burden_ratio) * 0.50)
      )
    END AS burden_score,
    CASE
      WHEN b.from_severity IS NULL OR b.to_severity IS NULL THEN 0.00
      WHEN b.to_coverage_ratio >= 0.67 THEN 0.00
      WHEN b.to_coverage_ratio >= 0.50 THEN -0.03
      WHEN b.to_coverage_ratio >= 0.33 THEN -0.06
      ELSE -0.08
    END AS coverage_penalty,
    (b.from_root_category <> b.to_root_category) AS cross_category,
    (b.from_allergen_set <> b.to_allergen_set) AS allergen_change
  FROM burdens b
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
      WHEN f.from_driver_subtype IS NULL OR f.to_driver_subtype IS NULL THEN FALSE
      WHEN f.from_driver_subtype <> f.to_driver_subtype THEN FALSE
      WHEN f.from_burden_ratio IS NULL OR f.to_burden_ratio IS NULL THEN FALSE
      WHEN f.to_severity > f.from_severity THEN FALSE
      WHEN f.to_burden_ratio > f.from_burden_ratio THEN FALSE
      WHEN f.recomputed_fodmap_safety_score < 0.500 THEN FALSE
      ELSE TRUE
    END AS auto_eligible,
    (
      f.to_coverage_ratio < 0.50
      OR f.recomputed_fodmap_safety_score < 0.60
      OR f.cross_category
      OR f.allergen_change
    ) AS second_review_required
  FROM final_scored f
)
SELECT
  w.rule_key,
  w.swap_rule_id,
  w.from_priority_rank,
  w.to_priority_rank,
  w.from_level,
  w.to_level,
  w.from_driver_subtype,
  w.to_driver_subtype,
  w.from_burden_ratio,
  w.to_burden_ratio,
  w.to_coverage_ratio,
  w.recomputed_fodmap_safety_score,
  w.auto_eligible,
  w.second_review_required,
  w.cross_category,
  w.allergen_change,
  br.flavor_match_score,
  br.texture_match_score,
  br.method_match_score,
  br.availability_fr_score,
  br.cost_fr_score
FROM with_eligibility w
JOIN batch_rules br ON br.swap_rule_id = w.swap_rule_id;

WITH updated AS (
  UPDATE swap_rule_scores s
  SET
    scoring_version = 'v2_full_rollup_2026_02_19_batch02',
    fodmap_safety_score = rs.recomputed_fodmap_safety_score
  FROM rescore_snapshot rs
  WHERE s.swap_rule_id = rs.swap_rule_id
    AND (
      s.scoring_version IS DISTINCT FROM 'v2_full_rollup_2026_02_19_batch02'
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
  'v2_full_rollup_2026_02_19_batch02'::TEXT AS scoring_version_snapshot,
  rs.recomputed_fodmap_safety_score AS fodmap_safety_score_snapshot,
  rs.from_level,
  rs.to_level,
  rs.from_driver_subtype,
  rs.to_driver_subtype,
  ROUND(rs.from_burden_ratio::NUMERIC, 6) AS from_burden_ratio,
  ROUND(rs.to_burden_ratio::NUMERIC, 6) AS to_burden_ratio,
  ROUND(rs.to_coverage_ratio::NUMERIC, 6) AS to_coverage_ratio,
  rs.auto_eligible,
  rs.second_review_required,
  ''::TEXT AS review_decision,
  ''::TEXT AS review_reason_code,
  ''::TEXT AS review_notes,
  ''::TEXT AS reviewed_by,
  ''::TEXT AS reviewed_at,
  ''::TEXT AS second_review_decision,
  ''::TEXT AS second_reviewed_by,
  ''::TEXT AS second_reviewed_at
FROM rescore_snapshot rs
ORDER BY rs.rule_key;

\copy review_export TO 'etl/phase3/decisions/phase3_swap_batch02_review_v1.csv' WITH (FORMAT csv, HEADER true)

COMMIT;
