\set ON_ERROR_STOP on

BEGIN;

-- Phase 3.7 Batch03 candidate generation (42-food universe).
-- Locked scope: ranks 1..42 only, excluding rank 2.

CREATE TEMP TABLE stg_allergens (
  priority_rank INTEGER,
  food_slug TEXT,
  allergen_family_code TEXT
) ON COMMIT DROP;

\copy stg_allergens (priority_rank,food_slug,allergen_family_code) FROM 'etl/phase3/data/phase3_food_allergen_families_v1.csv' WITH (FORMAT csv, HEADER true)

DO $$
DECLARE
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count FROM stg_allergens;
  IF bad_count < 42 THEN
    RAISE EXCEPTION 'allergen mapping must contain at least 42 rows, got %', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_allergens
  WHERE priority_rank < 1 OR priority_rank > 42;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'allergen mapping contains ranks outside 1..42';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_allergens
  WHERE allergen_family_code NOT IN ('none', 'tree_nut', 'gluten_grain', 'soy', 'dairy', 'shellfish');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'allergen mapping contains invalid allergen_family_code values';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT priority_rank
    FROM stg_allergens
    GROUP BY priority_rank
    HAVING COUNT(*) = 0
  ) missing;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'allergen mapping is missing one or more priority ranks';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT priority_rank
    FROM stg_allergens
    GROUP BY priority_rank
    HAVING BOOL_OR(allergen_family_code = 'none') AND COUNT(*) FILTER (WHERE allergen_family_code <> 'none') > 0
  ) mixed;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'allergen mapping cannot mix none with non-none families for a single food';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_allergens s
  JOIN phase2_priority_foods p ON p.priority_rank = s.priority_rank
  JOIN foods f ON f.food_id = p.resolved_food_id
  WHERE f.food_slug <> s.food_slug;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'allergen mapping food_slug does not match priority rank resolution for % rows', bad_count;
  END IF;
END $$;

CREATE TEMP TABLE generated_batch03 ON COMMIT DROP AS
WITH RECURSIVE cat_tree AS (
  SELECT
    fc.category_id,
    fc.parent_category_id,
    fc.code,
    fc.code AS root_code
  FROM food_categories fc
  WHERE fc.parent_category_id IS NULL

  UNION ALL

  SELECT
    fc.category_id,
    fc.parent_category_id,
    fc.code,
    ct.root_code
  FROM food_categories fc
  JOIN cat_tree ct ON fc.parent_category_id = ct.category_id
),
priority_base AS (
  SELECT
    p.priority_rank,
    p.resolved_food_id AS food_id,
    p.target_subtype,
    f.food_slug,
    f.canonical_name_fr,
    f.canonical_name_en,
    COALESCE((
      SELECT ct.root_code
      FROM food_category_memberships m
      JOIN cat_tree ct ON ct.category_id = m.category_id
      WHERE m.food_id = p.resolved_food_id
      ORDER BY m.is_primary DESC, m.category_id DESC
      LIMIT 1
    ), 'uncategorized') AS root_category_code,
    vr.overall_level::TEXT AS overall_level,
    vr.driver_subtype_code,
    vr.coverage_ratio
  FROM phase2_priority_foods p
  JOIN foods f ON f.food_id = p.resolved_food_id
  JOIN v_phase3_rollups_latest_full vr ON vr.priority_rank = p.priority_rank
  WHERE p.priority_rank BETWEEN 1 AND 42
),
traits AS (
  SELECT
    p.priority_rank,
    COALESCE((SELECT ARRAY_AGG(role_code ORDER BY role_code) FROM food_culinary_roles r WHERE r.food_id = p.food_id), ARRAY[]::TEXT[]) AS role_arr,
    COALESCE((SELECT ARRAY_AGG(flavor_code ORDER BY flavor_code) FROM food_flavor_profiles r WHERE r.food_id = p.food_id), ARRAY[]::TEXT[]) AS flavor_arr,
    COALESCE((SELECT ARRAY_AGG(texture_code ORDER BY texture_code) FROM food_texture_profiles r WHERE r.food_id = p.food_id), ARRAY[]::TEXT[]) AS texture_arr,
    COALESCE((SELECT ARRAY_AGG(behavior_code ORDER BY behavior_code) FROM food_cooking_behaviors r WHERE r.food_id = p.food_id), ARRAY[]::TEXT[]) AS behavior_arr,
    COALESCE((SELECT ARRAY_AGG(cuisine_code ORDER BY cuisine_code) FROM food_cuisine_affinities r WHERE r.food_id = p.food_id), ARRAY[]::TEXT[]) AS cuisine_arr
  FROM priority_base p
),
allergen_sets AS (
  SELECT
    s.priority_rank,
    COALESCE(
      ARRAY_AGG(s.allergen_family_code ORDER BY s.allergen_family_code) FILTER (WHERE s.allergen_family_code <> 'none'),
      ARRAY[]::TEXT[]
    ) AS allergen_set
  FROM stg_allergens s
  GROUP BY s.priority_rank
),
burdens AS (
  SELECT
    priority_rank,
    subtype_code,
    burden_ratio
  FROM v_phase3_rollup_subtype_levels_latest
),
pairs AS (
  SELECT
    f.priority_rank AS from_priority_rank,
    t.priority_rank AS to_priority_rank,
    f.food_id AS from_food_id,
    t.food_id AS to_food_id,
    f.food_slug AS from_food_slug,
    t.food_slug AS to_food_slug,
    f.canonical_name_fr AS from_name_fr,
    t.canonical_name_fr AS to_name_fr,
    f.canonical_name_en AS from_name_en,
    t.canonical_name_en AS to_name_en,
    f.root_category_code AS from_root_category,
    t.root_category_code AS to_root_category,
    f.overall_level AS from_overall_level,
    t.overall_level AS to_overall_level,
    f.coverage_ratio AS from_coverage_ratio,
    t.coverage_ratio AS to_coverage_ratio,
    f.driver_subtype_code AS from_driver_subtype,
    t.driver_subtype_code AS to_driver_subtype,
    bf.burden_ratio AS from_burden_ratio,
    bt.burden_ratio AS to_burden_ratio,
    af.allergen_set AS from_allergen_set,
    at.allergen_set AS to_allergen_set,
    tf.role_arr AS from_role_arr,
    tt.role_arr AS to_role_arr,
    tf.flavor_arr AS from_flavor_arr,
    tt.flavor_arr AS to_flavor_arr,
    tf.texture_arr AS from_texture_arr,
    tt.texture_arr AS to_texture_arr,
    tf.behavior_arr AS from_behavior_arr,
    tt.behavior_arr AS to_behavior_arr,
    tf.cuisine_arr AS from_cuisine_arr,
    tt.cuisine_arr AS to_cuisine_arr,
    CASE f.overall_level
      WHEN 'none' THEN 0
      WHEN 'low' THEN 1
      WHEN 'moderate' THEN 2
      WHEN 'high' THEN 3
      ELSE NULL
    END AS from_severity,
    CASE t.overall_level
      WHEN 'none' THEN 0
      WHEN 'low' THEN 1
      WHEN 'moderate' THEN 2
      WHEN 'high' THEN 3
      ELSE NULL
    END AS to_severity
  FROM priority_base f
  JOIN priority_base t ON t.priority_rank <> f.priority_rank
  JOIN traits tf ON tf.priority_rank = f.priority_rank
  JOIN traits tt ON tt.priority_rank = t.priority_rank
  JOIN allergen_sets af ON af.priority_rank = f.priority_rank
  JOIN allergen_sets at ON at.priority_rank = t.priority_rank
  LEFT JOIN burdens bf ON bf.priority_rank = f.priority_rank AND bf.subtype_code = f.driver_subtype_code
  LEFT JOIN burdens bt ON bt.priority_rank = t.priority_rank AND bt.subtype_code = t.driver_subtype_code
  WHERE f.priority_rank <> 2
    AND t.priority_rank <> 2
),
eligible AS (
  SELECT *
  FROM pairs p
  WHERE from_severity IS NOT NULL
    AND to_severity IS NOT NULL
    AND to_severity <= from_severity
    AND from_burden_ratio IS NOT NULL
    AND to_burden_ratio IS NOT NULL
    AND to_burden_ratio <= from_burden_ratio
    AND from_driver_subtype = to_driver_subtype
    AND NOT EXISTS (
      SELECT 1
      FROM swap_rules r
      WHERE r.from_food_id = p.from_food_id
        AND r.to_food_id = p.to_food_id
        AND r.rule_kind = 'direct_swap'
        AND (r.valid_to IS NULL OR r.valid_to >= CURRENT_DATE)
        AND NOT (
          COALESCE(r.notes, '') = 'phase3_batch03_rule'
          AND r.valid_from = DATE '2026-02-21'
        )
    )
    AND NOT EXISTS (
      SELECT 1
      FROM swap_rules r
      WHERE r.from_food_id = p.to_food_id
        AND r.to_food_id = p.from_food_id
        AND r.rule_kind = 'direct_swap'
        AND (r.valid_to IS NULL OR r.valid_to >= CURRENT_DATE)
        AND NOT (
          COALESCE(r.notes, '') = 'phase3_batch03_rule'
          AND r.valid_from = DATE '2026-02-21'
        )
    )
),
jaccard AS (
  SELECT
    e.*,
    CASE
      WHEN flavor_union_cnt = 0 THEN 0.000::NUMERIC(4,3)
      ELSE ROUND((flavor_inter_cnt::NUMERIC / flavor_union_cnt::NUMERIC), 3)::NUMERIC(4,3)
    END AS flavor_match_score,
    CASE
      WHEN texture_union_cnt = 0 THEN 0.000::NUMERIC(4,3)
      ELSE ROUND((texture_inter_cnt::NUMERIC / texture_union_cnt::NUMERIC), 3)::NUMERIC(4,3)
    END AS texture_match_score,
    CASE
      WHEN method_union_cnt = 0 THEN 0.000::NUMERIC(4,3)
      ELSE ROUND((method_inter_cnt::NUMERIC / method_union_cnt::NUMERIC), 3)::NUMERIC(4,3)
    END AS method_match_score
  FROM (
    SELECT
      e.*,
      (SELECT COUNT(*) FROM (SELECT DISTINCT v FROM unnest(e.from_flavor_arr) AS u(v)) a JOIN (SELECT DISTINCT v FROM unnest(e.to_flavor_arr) AS u(v)) b USING (v)) AS flavor_inter_cnt,
      (SELECT COUNT(DISTINCT v) FROM unnest(e.from_flavor_arr || e.to_flavor_arr) AS u(v)) AS flavor_union_cnt,
      (SELECT COUNT(*) FROM (SELECT DISTINCT v FROM unnest(e.from_texture_arr) AS u(v)) a JOIN (SELECT DISTINCT v FROM unnest(e.to_texture_arr) AS u(v)) b USING (v)) AS texture_inter_cnt,
      (SELECT COUNT(DISTINCT v) FROM unnest(e.from_texture_arr || e.to_texture_arr) AS u(v)) AS texture_union_cnt,
      (SELECT COUNT(*) FROM (SELECT DISTINCT v FROM unnest(e.from_behavior_arr) AS u(v)) a JOIN (SELECT DISTINCT v FROM unnest(e.to_behavior_arr) AS u(v)) b USING (v)) AS method_inter_cnt,
      (SELECT COUNT(DISTINCT v) FROM unnest(e.from_behavior_arr || e.to_behavior_arr) AS u(v)) AS method_union_cnt,
      COALESCE((SELECT string_agg(v, '|' ORDER BY v) FROM (SELECT DISTINCT v FROM unnest(e.from_behavior_arr) AS u(v) INTERSECT SELECT DISTINCT v FROM unnest(e.to_behavior_arr) AS u(v)) s), '') AS behavior_intersection,
      COALESCE((SELECT string_agg(v, '|' ORDER BY v) FROM (SELECT DISTINCT v FROM unnest(e.from_role_arr) AS u(v) INTERSECT SELECT DISTINCT v FROM unnest(e.to_role_arr) AS u(v)) s), '') AS role_intersection,
      COALESCE((SELECT string_agg(v, '|' ORDER BY v) FROM (SELECT DISTINCT v FROM unnest(e.from_cuisine_arr) AS u(v) INTERSECT SELECT DISTINCT v FROM unnest(e.to_cuisine_arr) AS u(v)) s), '') AS cuisine_intersection
    FROM eligible e
  ) e
),
scored AS (
  SELECT
    j.*,
    CASE
      WHEN (j.from_severity - j.to_severity) >= 2 THEN 0.95
      WHEN (j.from_severity - j.to_severity) = 1 THEN 0.80
      WHEN (j.from_severity - j.to_severity) = 0 THEN 0.60
      ELSE 0.00
    END AS level_score,
    CASE
      WHEN j.from_burden_ratio <= 0 AND j.to_burden_ratio <= 0 THEN 1.00
      WHEN j.from_burden_ratio <= 0 AND j.to_burden_ratio > 0 THEN 0.00
      ELSE GREATEST(
        0.00,
        LEAST(1.00, 0.50 + ((j.from_burden_ratio - j.to_burden_ratio) / j.from_burden_ratio) * 0.50)
      )
    END AS burden_score,
    CASE
      WHEN j.to_coverage_ratio >= 0.67 THEN 0.00
      WHEN j.to_coverage_ratio >= 0.50 THEN -0.03
      WHEN j.to_coverage_ratio >= 0.33 THEN -0.06
      ELSE -0.08
    END AS coverage_penalty,
    (j.from_root_category <> j.to_root_category) AS cross_category,
    (j.from_allergen_set <> j.to_allergen_set) AS allergen_change
  FROM jaccard j
  WHERE j.role_intersection <> ''
    AND (
      j.flavor_match_score > 0.000
      OR j.texture_match_score > 0.000
      OR j.method_match_score > 0.000
    )
),
ranked AS (
  SELECT
    s.*,
    ROUND(
      GREATEST(
        0.00,
        LEAST(1.00, (0.70 * s.level_score + 0.30 * s.burden_score + s.coverage_penalty))
      )::NUMERIC,
      3
    )::NUMERIC(4,3) AS fodmap_safety_score,
    ROUND((
      0.75 * GREATEST(0.00, LEAST(1.00, (0.70 * s.level_score + 0.30 * s.burden_score + s.coverage_penalty))) +
      0.15 * s.flavor_match_score +
      0.05 * s.texture_match_score +
      0.05 * s.method_match_score
    )::NUMERIC, 3)::NUMERIC(5,3) AS ranking_score,
    (
      s.to_coverage_ratio < 0.50
      OR GREATEST(0.00, LEAST(1.00, (0.70 * s.level_score + 0.30 * s.burden_score + s.coverage_penalty))) < 0.60
      OR s.cross_category
      OR s.allergen_change
    ) AS second_review_required,
    ROW_NUMBER() OVER (
      ORDER BY
        ROUND((
          0.75 * GREATEST(0.00, LEAST(1.00, (0.70 * s.level_score + 0.30 * s.burden_score + s.coverage_penalty))) +
          0.15 * s.flavor_match_score +
          0.05 * s.texture_match_score +
          0.05 * s.method_match_score
        )::NUMERIC, 3) DESC,
        s.to_coverage_ratio DESC,
        s.to_food_slug ASC
    ) AS global_rank
  FROM scored s
),
provisional_ranked AS (
  SELECT
    p.*,
    ROW_NUMBER() OVER (
      PARTITION BY p.from_priority_rank
      ORDER BY p.ranking_score DESC, p.to_food_slug ASC
    ) AS from_slot,
    ROW_NUMBER() OVER (
      PARTITION BY p.to_priority_rank
      ORDER BY p.ranking_score DESC, p.to_food_slug ASC
    ) AS to_slot
  FROM ranked p
  WHERE p.global_rank <= 40
),
trimmed_keys AS (
  SELECT
    from_priority_rank,
    to_priority_rank
  FROM provisional_ranked
  WHERE from_slot <= 5
    AND to_slot <= 5
),
trimmed_counts_from AS (
  SELECT from_priority_rank, COUNT(*) AS kept_from_count
  FROM trimmed_keys
  GROUP BY from_priority_rank
),
trimmed_counts_to AS (
  SELECT to_priority_rank, COUNT(*) AS kept_to_count
  FROM trimmed_keys
  GROUP BY to_priority_rank
),
backfill_candidates AS (
  SELECT
    r.from_priority_rank,
    r.to_priority_rank,
    COALESCE(tcf.kept_from_count, 0) AS kept_from_count,
    COALESCE(tct.kept_to_count, 0) AS kept_to_count,
    ROW_NUMBER() OVER (
      PARTITION BY r.from_priority_rank
      ORDER BY r.ranking_score DESC, r.to_food_slug ASC
    ) AS from_wait_slot,
    ROW_NUMBER() OVER (
      PARTITION BY r.to_priority_rank
      ORDER BY r.ranking_score DESC, r.to_food_slug ASC
    ) AS to_wait_slot,
    ROW_NUMBER() OVER (
      ORDER BY r.ranking_score DESC, r.to_coverage_ratio DESC, r.to_food_slug ASC
    ) AS wait_rank
  FROM ranked r
  LEFT JOIN trimmed_keys t
    ON t.from_priority_rank = r.from_priority_rank
   AND t.to_priority_rank = r.to_priority_rank
  LEFT JOIN trimmed_counts_from tcf ON tcf.from_priority_rank = r.from_priority_rank
  LEFT JOIN trimmed_counts_to tct ON tct.to_priority_rank = r.to_priority_rank
  WHERE r.global_rank > 40
    AND t.from_priority_rank IS NULL
),
backfill_pool AS (
  SELECT *
  FROM backfill_candidates
  WHERE (kept_from_count + from_wait_slot) <= 5
    AND (kept_to_count + to_wait_slot) <= 5
),
needed AS (
  SELECT GREATEST(0, 40 - (SELECT COUNT(*) FROM trimmed_keys)) AS missing
),
backfilled_keys AS (
  SELECT
    b.from_priority_rank,
    b.to_priority_rank
  FROM backfill_pool b
  CROSS JOIN needed n
  WHERE b.wait_rank <= n.missing
),
selected_keys AS (
  SELECT * FROM trimmed_keys
  UNION ALL
  SELECT * FROM backfilled_keys
),
selected AS (
  SELECT r.*
  FROM ranked r
  JOIN selected_keys sk
    ON sk.from_priority_rank = r.from_priority_rank
   AND sk.to_priority_rank = r.to_priority_rank
),
selected_ordered AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY ranking_score DESC, to_coverage_ratio DESC, to_food_slug ASC) AS row_num,
    s.*
  FROM selected s
)
SELECT
  FORMAT('B03_%s', LPAD(so.row_num::TEXT, 3, '0')) AS rule_key,
  so.from_priority_rank,
  so.to_priority_rank,
  'direct_swap'::TEXT AS rule_kind,
  FORMAT('Remplacez %s par %s dans les usages similaires.', so.from_name_fr, so.to_name_fr) AS instruction_fr,
  FORMAT('Replace %s with %s for similar culinary uses.', so.from_name_en, so.to_name_en) AS instruction_en,
  0.500::NUMERIC(8,3) AS min_ratio,
  1.500::NUMERIC(8,3) AS max_ratio,
  1.000::NUMERIC(8,3) AS default_ratio,
  'inferred'::TEXT AS evidence_tier,
  0.750::NUMERIC(4,3) AS confidence_score,
  DATE '2026-02-21' AS valid_from,
  'draft'::TEXT AS status,
  'phase3_batch03_rule'::TEXT AS notes,
  so.behavior_intersection AS context_cooking_methods,
  so.role_intersection AS context_dish_roles,
  so.cuisine_intersection AS context_cuisines,
  ''::TEXT AS excluded_priority_ranks,
  so.fodmap_safety_score,
  so.flavor_match_score,
  so.texture_match_score,
  so.method_match_score,
  0.500::NUMERIC(4,3) AS availability_fr_score,
  0.500::NUMERIC(4,3) AS cost_fr_score,
  so.ranking_score,
  so.from_overall_level,
  so.to_overall_level,
  ROUND(so.from_burden_ratio::NUMERIC, 6) AS from_burden_ratio,
  ROUND(so.to_burden_ratio::NUMERIC, 6) AS to_burden_ratio,
  ROUND(so.to_coverage_ratio::NUMERIC, 6) AS to_coverage_ratio,
  so.from_driver_subtype,
  so.to_driver_subtype,
  so.from_root_category,
  so.to_root_category,
  so.allergen_change,
  so.second_review_required
FROM selected_ordered so
ORDER BY so.row_num;

DO $$
DECLARE
  selected_count INTEGER;
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO selected_count FROM generated_batch03;
  IF selected_count < 1 OR selected_count > 40 THEN
    RAISE EXCEPTION 'selected candidate count out of range (1..40): %', selected_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM generated_batch03
  WHERE from_priority_rank = 2 OR to_priority_rank = 2;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'rank2 exclusion failed in generated candidates';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT from_priority_rank, to_priority_rank, rule_kind
    FROM generated_batch03
    GROUP BY from_priority_rank, to_priority_rank, rule_kind
    HAVING COUNT(*) > 1
  ) dup;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'duplicate from/to/rule_kind rows in generated candidates';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT from_priority_rank
    FROM generated_batch03
    GROUP BY from_priority_rank
    HAVING COUNT(*) > 5
  ) capped;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'per-from cap failed: at least one source has more than 5 generated rows';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT to_priority_rank
    FROM generated_batch03
    GROUP BY to_priority_rank
    HAVING COUNT(*) > 5
  ) capped;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'per-to cap failed: at least one target has more than 5 generated rows';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM generated_batch03
  WHERE COALESCE(context_dish_roles, '') = ''
     OR (
       flavor_match_score = 0.000
       AND texture_match_score = 0.000
       AND method_match_score = 0.000
     );
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'culinary compatibility gate failed on % generated rows', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM generated_batch03
  WHERE from_driver_subtype IS DISTINCT FROM to_driver_subtype;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'same-subtype direct_swap hard gate failed on % generated rows', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM generated_batch03 g
  JOIN phase2_priority_foods pf ON pf.priority_rank = g.from_priority_rank
  JOIN phase2_priority_foods pt ON pt.priority_rank = g.to_priority_rank
  JOIN swap_rules r
   ON r.from_food_id = pf.resolved_food_id
   AND r.to_food_id = pt.resolved_food_id
   AND r.rule_kind = g.rule_kind
   AND (r.valid_to IS NULL OR r.valid_to >= CURRENT_DATE)
   AND NOT (
     COALESCE(r.notes, '') = 'phase3_batch03_rule'
     AND r.valid_from = DATE '2026-02-21'
   );
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'exact open-validity non-batch03 pair collision detected on % generated rows', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM generated_batch03 g
  JOIN phase2_priority_foods pf ON pf.priority_rank = g.from_priority_rank
  JOIN phase2_priority_foods pt ON pt.priority_rank = g.to_priority_rank
  JOIN swap_rules r
   ON r.from_food_id = pt.resolved_food_id
   AND r.to_food_id = pf.resolved_food_id
   AND r.rule_kind = g.rule_kind
   AND (r.valid_to IS NULL OR r.valid_to >= CURRENT_DATE)
   AND NOT (
     COALESCE(r.notes, '') = 'phase3_batch03_rule'
     AND r.valid_from = DATE '2026-02-21'
   );
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'reverse open-validity non-batch03 pair collision detected on % generated rows', bad_count;
  END IF;
END $$;

\copy generated_batch03 TO 'etl/phase3/data/phase3_swap_rules_batch03_generated_v1.csv' WITH (FORMAT csv, HEADER true)

SELECT
  COUNT(*) AS generated_rows,
  COUNT(*) FILTER (WHERE second_review_required) AS second_review_rows,
  MIN(ranking_score) AS min_ranking_score,
  MAX(ranking_score) AS max_ranking_score
FROM generated_batch03;

COMMIT;
