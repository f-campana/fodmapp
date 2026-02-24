\set ON_ERROR_STOP on

BEGIN;

-- Phase 3.6c companion probe (non-mutating):
-- Estimate Batch04 candidate yield after coverage updates, using the same hard gates as Batch03 generation.

CREATE TEMP TABLE stg_allergens (
  priority_rank INTEGER,
  food_slug TEXT,
  allergen_family_code TEXT
) ON COMMIT DROP;

\copy stg_allergens (priority_rank,food_slug,allergen_family_code) FROM 'etl/phase3/data/phase3_food_allergen_families_v1.csv' WITH (FORMAT csv, HEADER true)

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
    COALESCE((SELECT ARRAY_AGG(behavior_code ORDER BY behavior_code) FROM food_cooking_behaviors r WHERE r.food_id = p.food_id), ARRAY[]::TEXT[]) AS behavior_arr
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
    )
    AND NOT EXISTS (
      SELECT 1
      FROM swap_rules r
      WHERE r.from_food_id = p.to_food_id
        AND r.to_food_id = p.from_food_id
        AND r.rule_kind = 'direct_swap'
        AND (r.valid_to IS NULL OR r.valid_to >= CURRENT_DATE)
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
    END AS method_match_score,
    COALESCE((SELECT string_agg(v, '|' ORDER BY v) FROM (SELECT DISTINCT v FROM unnest(e.from_role_arr) AS u(v) INTERSECT SELECT DISTINCT v FROM unnest(e.to_role_arr) AS u(v)) s), '') AS role_intersection
  FROM (
    SELECT
      e.*,
      (SELECT COUNT(*) FROM (SELECT DISTINCT v FROM unnest(e.from_flavor_arr) AS u(v)) a JOIN (SELECT DISTINCT v FROM unnest(e.to_flavor_arr) AS u(v)) b USING (v)) AS flavor_inter_cnt,
      (SELECT COUNT(DISTINCT v) FROM unnest(e.from_flavor_arr || e.to_flavor_arr) AS u(v)) AS flavor_union_cnt,
      (SELECT COUNT(*) FROM (SELECT DISTINCT v FROM unnest(e.from_texture_arr) AS u(v)) a JOIN (SELECT DISTINCT v FROM unnest(e.to_texture_arr) AS u(v)) b USING (v)) AS texture_inter_cnt,
      (SELECT COUNT(DISTINCT v) FROM unnest(e.from_texture_arr || e.to_texture_arr) AS u(v)) AS texture_union_cnt,
      (SELECT COUNT(*) FROM (SELECT DISTINCT v FROM unnest(e.from_behavior_arr) AS u(v)) a JOIN (SELECT DISTINCT v FROM unnest(e.to_behavior_arr) AS u(v)) b USING (v)) AS method_inter_cnt,
      (SELECT COUNT(DISTINCT v) FROM unnest(e.from_behavior_arr || e.to_behavior_arr) AS u(v)) AS method_union_cnt
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
      ELSE GREATEST(0.00, LEAST(1.00, 0.50 + ((j.from_burden_ratio - j.to_burden_ratio) / j.from_burden_ratio) * 0.50))
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
    AND (j.flavor_match_score > 0.000 OR j.texture_match_score > 0.000 OR j.method_match_score > 0.000)
),
ranked AS (
  SELECT
    s.*,
    ROUND(GREATEST(0.00, LEAST(1.00, (0.70 * s.level_score + 0.30 * s.burden_score + s.coverage_penalty)))::NUMERIC, 3)::NUMERIC(4,3) AS fodmap_safety_score,
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
    ) AS second_review_required
  FROM scored s
)
SELECT
  COUNT(*) AS candidate_pool_rows,
  COUNT(*) FILTER (WHERE second_review_required) AS second_review_required_rows,
  COUNT(*) FILTER (WHERE NOT second_review_required) AS single_review_rows,
  COUNT(DISTINCT from_priority_rank) AS distinct_from_ranks,
  COUNT(DISTINCT to_priority_rank) AS distinct_to_ranks
FROM ranked;

WITH RECURSIVE cat_tree AS (
  SELECT fc.category_id, fc.parent_category_id, fc.code, fc.code AS root_code
  FROM food_categories fc
  WHERE fc.parent_category_id IS NULL
  UNION ALL
  SELECT fc.category_id, fc.parent_category_id, fc.code, ct.root_code
  FROM food_categories fc
  JOIN cat_tree ct ON fc.parent_category_id = ct.category_id
),
priority_base AS (
  SELECT p.priority_rank, p.resolved_food_id AS food_id, f.food_slug, vr.overall_level::TEXT AS overall_level,
         vr.driver_subtype_code, vr.coverage_ratio,
         COALESCE((SELECT ct.root_code FROM food_category_memberships m JOIN cat_tree ct ON ct.category_id = m.category_id WHERE m.food_id = p.resolved_food_id ORDER BY m.is_primary DESC, m.category_id DESC LIMIT 1), 'uncategorized') AS root_category_code
  FROM phase2_priority_foods p
  JOIN foods f ON f.food_id = p.resolved_food_id
  JOIN v_phase3_rollups_latest_full vr ON vr.priority_rank = p.priority_rank
  WHERE p.priority_rank BETWEEN 1 AND 42
),
traits AS (
  SELECT p.priority_rank,
         COALESCE((SELECT ARRAY_AGG(role_code ORDER BY role_code) FROM food_culinary_roles r WHERE r.food_id = p.food_id), ARRAY[]::TEXT[]) AS role_arr,
         COALESCE((SELECT ARRAY_AGG(flavor_code ORDER BY flavor_code) FROM food_flavor_profiles r WHERE r.food_id = p.food_id), ARRAY[]::TEXT[]) AS flavor_arr,
         COALESCE((SELECT ARRAY_AGG(texture_code ORDER BY texture_code) FROM food_texture_profiles r WHERE r.food_id = p.food_id), ARRAY[]::TEXT[]) AS texture_arr,
         COALESCE((SELECT ARRAY_AGG(behavior_code ORDER BY behavior_code) FROM food_cooking_behaviors r WHERE r.food_id = p.food_id), ARRAY[]::TEXT[]) AS behavior_arr
  FROM priority_base p
),
allergen_sets AS (
  SELECT s.priority_rank,
         COALESCE(ARRAY_AGG(s.allergen_family_code ORDER BY s.allergen_family_code) FILTER (WHERE s.allergen_family_code <> 'none'), ARRAY[]::TEXT[]) AS allergen_set
  FROM stg_allergens s
  GROUP BY s.priority_rank
),
burdens AS (
  SELECT priority_rank, subtype_code, burden_ratio
  FROM v_phase3_rollup_subtype_levels_latest
),
pairs AS (
  SELECT f.priority_rank AS from_priority_rank, t.priority_rank AS to_priority_rank,
         f.food_id AS from_food_id, t.food_id AS to_food_id,
         f.food_slug AS from_food_slug, t.food_slug AS to_food_slug,
         f.root_category_code AS from_root_category, t.root_category_code AS to_root_category,
         f.overall_level AS from_overall_level, t.overall_level AS to_overall_level,
         t.coverage_ratio AS to_coverage_ratio,
         f.driver_subtype_code AS from_driver_subtype, t.driver_subtype_code AS to_driver_subtype,
         bf.burden_ratio AS from_burden_ratio, bt.burden_ratio AS to_burden_ratio,
         af.allergen_set AS from_allergen_set, at.allergen_set AS to_allergen_set,
         tf.role_arr AS from_role_arr, tt.role_arr AS to_role_arr,
         tf.flavor_arr AS from_flavor_arr, tt.flavor_arr AS to_flavor_arr,
         tf.texture_arr AS from_texture_arr, tt.texture_arr AS to_texture_arr,
         tf.behavior_arr AS from_behavior_arr, tt.behavior_arr AS to_behavior_arr,
         CASE f.overall_level WHEN 'none' THEN 0 WHEN 'low' THEN 1 WHEN 'moderate' THEN 2 WHEN 'high' THEN 3 ELSE NULL END AS from_severity,
         CASE t.overall_level WHEN 'none' THEN 0 WHEN 'low' THEN 1 WHEN 'moderate' THEN 2 WHEN 'high' THEN 3 ELSE NULL END AS to_severity
  FROM priority_base f
  JOIN priority_base t ON t.priority_rank <> f.priority_rank
  JOIN traits tf ON tf.priority_rank = f.priority_rank
  JOIN traits tt ON tt.priority_rank = t.priority_rank
  JOIN allergen_sets af ON af.priority_rank = f.priority_rank
  JOIN allergen_sets at ON at.priority_rank = t.priority_rank
  LEFT JOIN burdens bf ON bf.priority_rank = f.priority_rank AND bf.subtype_code = f.driver_subtype_code
  LEFT JOIN burdens bt ON bt.priority_rank = t.priority_rank AND bt.subtype_code = t.driver_subtype_code
  WHERE f.priority_rank <> 2 AND t.priority_rank <> 2
),
eligible AS (
  SELECT * FROM pairs p
  WHERE from_severity IS NOT NULL
    AND to_severity IS NOT NULL
    AND to_severity <= from_severity
    AND from_burden_ratio IS NOT NULL
    AND to_burden_ratio IS NOT NULL
    AND to_burden_ratio <= from_burden_ratio
    AND from_driver_subtype = to_driver_subtype
    AND NOT EXISTS (
      SELECT 1 FROM swap_rules r
      WHERE r.from_food_id = p.from_food_id AND r.to_food_id = p.to_food_id
        AND r.rule_kind = 'direct_swap' AND (r.valid_to IS NULL OR r.valid_to >= CURRENT_DATE)
    )
    AND NOT EXISTS (
      SELECT 1 FROM swap_rules r
      WHERE r.from_food_id = p.to_food_id AND r.to_food_id = p.from_food_id
        AND r.rule_kind = 'direct_swap' AND (r.valid_to IS NULL OR r.valid_to >= CURRENT_DATE)
    )
),
jaccard AS (
  SELECT e.*,
         CASE WHEN flavor_union_cnt = 0 THEN 0.000::NUMERIC(4,3) ELSE ROUND((flavor_inter_cnt::NUMERIC / flavor_union_cnt::NUMERIC), 3)::NUMERIC(4,3) END AS flavor_match_score,
         CASE WHEN texture_union_cnt = 0 THEN 0.000::NUMERIC(4,3) ELSE ROUND((texture_inter_cnt::NUMERIC / texture_union_cnt::NUMERIC), 3)::NUMERIC(4,3) END AS texture_match_score,
         CASE WHEN method_union_cnt = 0 THEN 0.000::NUMERIC(4,3) ELSE ROUND((method_inter_cnt::NUMERIC / method_union_cnt::NUMERIC), 3)::NUMERIC(4,3) END AS method_match_score,
         COALESCE((SELECT string_agg(v, '|' ORDER BY v) FROM (SELECT DISTINCT v FROM unnest(e.from_role_arr) AS u(v) INTERSECT SELECT DISTINCT v FROM unnest(e.to_role_arr) AS u(v)) s), '') AS role_intersection
  FROM (
    SELECT e.*,
           (SELECT COUNT(*) FROM (SELECT DISTINCT v FROM unnest(e.from_flavor_arr) AS u(v)) a JOIN (SELECT DISTINCT v FROM unnest(e.to_flavor_arr) AS u(v)) b USING (v)) AS flavor_inter_cnt,
           (SELECT COUNT(DISTINCT v) FROM unnest(e.from_flavor_arr || e.to_flavor_arr) AS u(v)) AS flavor_union_cnt,
           (SELECT COUNT(*) FROM (SELECT DISTINCT v FROM unnest(e.from_texture_arr) AS u(v)) a JOIN (SELECT DISTINCT v FROM unnest(e.to_texture_arr) AS u(v)) b USING (v)) AS texture_inter_cnt,
           (SELECT COUNT(DISTINCT v) FROM unnest(e.from_texture_arr || e.to_texture_arr) AS u(v)) AS texture_union_cnt,
           (SELECT COUNT(*) FROM (SELECT DISTINCT v FROM unnest(e.from_behavior_arr) AS u(v)) a JOIN (SELECT DISTINCT v FROM unnest(e.to_behavior_arr) AS u(v)) b USING (v)) AS method_inter_cnt,
           (SELECT COUNT(DISTINCT v) FROM unnest(e.from_behavior_arr || e.to_behavior_arr) AS u(v)) AS method_union_cnt
    FROM eligible e
  ) e
),
scored AS (
  SELECT j.*,
         CASE WHEN (j.from_severity - j.to_severity) >= 2 THEN 0.95 WHEN (j.from_severity - j.to_severity) = 1 THEN 0.80 WHEN (j.from_severity - j.to_severity) = 0 THEN 0.60 ELSE 0.00 END AS level_score,
         CASE WHEN j.from_burden_ratio <= 0 AND j.to_burden_ratio <= 0 THEN 1.00 WHEN j.from_burden_ratio <= 0 AND j.to_burden_ratio > 0 THEN 0.00 ELSE GREATEST(0.00, LEAST(1.00, 0.50 + ((j.from_burden_ratio - j.to_burden_ratio) / j.from_burden_ratio) * 0.50)) END AS burden_score,
         CASE WHEN j.to_coverage_ratio >= 0.67 THEN 0.00 WHEN j.to_coverage_ratio >= 0.50 THEN -0.03 WHEN j.to_coverage_ratio >= 0.33 THEN -0.06 ELSE -0.08 END AS coverage_penalty,
         (j.from_root_category <> j.to_root_category) AS cross_category,
         (j.from_allergen_set <> j.to_allergen_set) AS allergen_change
  FROM jaccard j
  WHERE j.role_intersection <> ''
    AND (j.flavor_match_score > 0.000 OR j.texture_match_score > 0.000 OR j.method_match_score > 0.000)
),
ranked AS (
  SELECT s.*, 
         ROUND(GREATEST(0.00, LEAST(1.00, (0.70 * s.level_score + 0.30 * s.burden_score + s.coverage_penalty)))::NUMERIC, 3)::NUMERIC(4,3) AS fodmap_safety_score,
         ROUND((0.75 * GREATEST(0.00, LEAST(1.00, (0.70 * s.level_score + 0.30 * s.burden_score + s.coverage_penalty))) + 0.15 * s.flavor_match_score + 0.05 * s.texture_match_score + 0.05 * s.method_match_score)::NUMERIC, 3)::NUMERIC(5,3) AS ranking_score,
         (s.to_coverage_ratio < 0.50 OR GREATEST(0.00, LEAST(1.00, (0.70 * s.level_score + 0.30 * s.burden_score + s.coverage_penalty))) < 0.60 OR s.cross_category OR s.allergen_change) AS second_review_required
  FROM scored s
)
SELECT
  from_priority_rank,
  to_priority_rank,
  from_food_slug,
  to_food_slug,
  from_driver_subtype,
  to_driver_subtype,
  ROUND(from_burden_ratio::NUMERIC, 3) AS from_burden_ratio,
  ROUND(to_burden_ratio::NUMERIC, 3) AS to_burden_ratio,
  ROUND(to_coverage_ratio::NUMERIC, 4) AS to_coverage_ratio,
  fodmap_safety_score,
  ranking_score,
  second_review_required,
  cross_category,
  allergen_change
FROM ranked
ORDER BY ranking_score DESC, to_coverage_ratio DESC, to_food_slug ASC
LIMIT 15;

WITH current_probe AS (
  WITH RECURSIVE cat_tree AS (
    SELECT fc.category_id, fc.parent_category_id, fc.code, fc.code AS root_code
    FROM food_categories fc
    WHERE fc.parent_category_id IS NULL
    UNION ALL
    SELECT fc.category_id, fc.parent_category_id, fc.code, ct.root_code
    FROM food_categories fc
    JOIN cat_tree ct ON fc.parent_category_id = ct.category_id
  ),
  priority_base AS (
    SELECT p.priority_rank, p.resolved_food_id AS food_id, f.food_slug, vr.overall_level::TEXT AS overall_level, vr.driver_subtype_code, vr.coverage_ratio,
           COALESCE((SELECT ct.root_code FROM food_category_memberships m JOIN cat_tree ct ON ct.category_id = m.category_id WHERE m.food_id = p.resolved_food_id ORDER BY m.is_primary DESC, m.category_id DESC LIMIT 1), 'uncategorized') AS root_category_code
    FROM phase2_priority_foods p
    JOIN foods f ON f.food_id = p.resolved_food_id
    JOIN v_phase3_rollups_latest_full vr ON vr.priority_rank = p.priority_rank
    WHERE p.priority_rank BETWEEN 1 AND 42
  ),
  traits AS (
    SELECT p.priority_rank,
           COALESCE((SELECT ARRAY_AGG(role_code ORDER BY role_code) FROM food_culinary_roles r WHERE r.food_id = p.food_id), ARRAY[]::TEXT[]) AS role_arr,
           COALESCE((SELECT ARRAY_AGG(flavor_code ORDER BY flavor_code) FROM food_flavor_profiles r WHERE r.food_id = p.food_id), ARRAY[]::TEXT[]) AS flavor_arr,
           COALESCE((SELECT ARRAY_AGG(texture_code ORDER BY texture_code) FROM food_texture_profiles r WHERE r.food_id = p.food_id), ARRAY[]::TEXT[]) AS texture_arr,
           COALESCE((SELECT ARRAY_AGG(behavior_code ORDER BY behavior_code) FROM food_cooking_behaviors r WHERE r.food_id = p.food_id), ARRAY[]::TEXT[]) AS behavior_arr
    FROM priority_base p
  ),
  allergen_sets AS (
    SELECT s.priority_rank,
           COALESCE(ARRAY_AGG(s.allergen_family_code ORDER BY s.allergen_family_code) FILTER (WHERE s.allergen_family_code <> 'none'), ARRAY[]::TEXT[]) AS allergen_set
    FROM stg_allergens s
    GROUP BY s.priority_rank
  ),
  burdens AS (
    SELECT priority_rank, subtype_code, burden_ratio
    FROM v_phase3_rollup_subtype_levels_latest
  ),
  pairs AS (
    SELECT f.priority_rank AS from_priority_rank, t.priority_rank AS to_priority_rank,
           f.food_id AS from_food_id, t.food_id AS to_food_id,
           f.root_category_code AS from_root_category, t.root_category_code AS to_root_category,
           t.coverage_ratio AS to_coverage_ratio,
           f.driver_subtype_code AS from_driver_subtype, t.driver_subtype_code AS to_driver_subtype,
           bf.burden_ratio AS from_burden_ratio, bt.burden_ratio AS to_burden_ratio,
           af.allergen_set AS from_allergen_set, at.allergen_set AS to_allergen_set,
           tf.role_arr AS from_role_arr, tt.role_arr AS to_role_arr,
           tf.flavor_arr AS from_flavor_arr, tt.flavor_arr AS to_flavor_arr,
           tf.texture_arr AS from_texture_arr, tt.texture_arr AS to_texture_arr,
           tf.behavior_arr AS from_behavior_arr, tt.behavior_arr AS to_behavior_arr,
           CASE f.overall_level WHEN 'none' THEN 0 WHEN 'low' THEN 1 WHEN 'moderate' THEN 2 WHEN 'high' THEN 3 ELSE NULL END AS from_severity,
           CASE t.overall_level WHEN 'none' THEN 0 WHEN 'low' THEN 1 WHEN 'moderate' THEN 2 WHEN 'high' THEN 3 ELSE NULL END AS to_severity
    FROM priority_base f
    JOIN priority_base t ON t.priority_rank <> f.priority_rank
    JOIN traits tf ON tf.priority_rank = f.priority_rank
    JOIN traits tt ON tt.priority_rank = t.priority_rank
    JOIN allergen_sets af ON af.priority_rank = f.priority_rank
    JOIN allergen_sets at ON at.priority_rank = t.priority_rank
    LEFT JOIN burdens bf ON bf.priority_rank = f.priority_rank AND bf.subtype_code = f.driver_subtype_code
    LEFT JOIN burdens bt ON bt.priority_rank = t.priority_rank AND bt.subtype_code = t.driver_subtype_code
    WHERE f.priority_rank <> 2 AND t.priority_rank <> 2
  ),
  eligible AS (
    SELECT * FROM pairs p
    WHERE from_severity IS NOT NULL AND to_severity IS NOT NULL
      AND to_severity <= from_severity
      AND from_burden_ratio IS NOT NULL AND to_burden_ratio IS NOT NULL
      AND to_burden_ratio <= from_burden_ratio
      AND from_driver_subtype = to_driver_subtype
      AND NOT EXISTS (SELECT 1 FROM swap_rules r WHERE r.from_food_id = p.from_food_id AND r.to_food_id = p.to_food_id AND r.rule_kind = 'direct_swap' AND (r.valid_to IS NULL OR r.valid_to >= CURRENT_DATE))
      AND NOT EXISTS (SELECT 1 FROM swap_rules r WHERE r.from_food_id = p.to_food_id AND r.to_food_id = p.from_food_id AND r.rule_kind = 'direct_swap' AND (r.valid_to IS NULL OR r.valid_to >= CURRENT_DATE))
  ),
  jaccard AS (
    SELECT e.*,
           CASE WHEN flavor_union_cnt = 0 THEN 0.000::NUMERIC(4,3) ELSE ROUND((flavor_inter_cnt::NUMERIC / flavor_union_cnt::NUMERIC), 3)::NUMERIC(4,3) END AS flavor_match_score,
           CASE WHEN texture_union_cnt = 0 THEN 0.000::NUMERIC(4,3) ELSE ROUND((texture_inter_cnt::NUMERIC / texture_union_cnt::NUMERIC), 3)::NUMERIC(4,3) END AS texture_match_score,
           CASE WHEN method_union_cnt = 0 THEN 0.000::NUMERIC(4,3) ELSE ROUND((method_inter_cnt::NUMERIC / method_union_cnt::NUMERIC), 3)::NUMERIC(4,3) END AS method_match_score,
           COALESCE((SELECT string_agg(v, '|' ORDER BY v) FROM (SELECT DISTINCT v FROM unnest(e.from_role_arr) AS u(v) INTERSECT SELECT DISTINCT v FROM unnest(e.to_role_arr) AS u(v)) s), '') AS role_intersection
    FROM (
      SELECT e.*,
             (SELECT COUNT(*) FROM (SELECT DISTINCT v FROM unnest(e.from_flavor_arr) AS u(v)) a JOIN (SELECT DISTINCT v FROM unnest(e.to_flavor_arr) AS u(v)) b USING (v)) AS flavor_inter_cnt,
             (SELECT COUNT(DISTINCT v) FROM unnest(e.from_flavor_arr || e.to_flavor_arr) AS u(v)) AS flavor_union_cnt,
             (SELECT COUNT(*) FROM (SELECT DISTINCT v FROM unnest(e.from_texture_arr) AS u(v)) a JOIN (SELECT DISTINCT v FROM unnest(e.to_texture_arr) AS u(v)) b USING (v)) AS texture_inter_cnt,
             (SELECT COUNT(DISTINCT v) FROM unnest(e.from_texture_arr || e.to_texture_arr) AS u(v)) AS texture_union_cnt,
             (SELECT COUNT(*) FROM (SELECT DISTINCT v FROM unnest(e.from_behavior_arr) AS u(v)) a JOIN (SELECT DISTINCT v FROM unnest(e.to_behavior_arr) AS u(v)) b USING (v)) AS method_inter_cnt,
             (SELECT COUNT(DISTINCT v) FROM unnest(e.from_behavior_arr || e.to_behavior_arr) AS u(v)) AS method_union_cnt
      FROM eligible e
    ) e
  ),
  scored AS (
    SELECT j.*,
           CASE WHEN (j.from_severity - j.to_severity) >= 2 THEN 0.95 WHEN (j.from_severity - j.to_severity) = 1 THEN 0.80 WHEN (j.from_severity - j.to_severity) = 0 THEN 0.60 ELSE 0.00 END AS level_score,
           CASE WHEN j.from_burden_ratio <= 0 AND j.to_burden_ratio <= 0 THEN 1.00 WHEN j.from_burden_ratio <= 0 AND j.to_burden_ratio > 0 THEN 0.00 ELSE GREATEST(0.00, LEAST(1.00, 0.50 + ((j.from_burden_ratio - j.to_burden_ratio) / j.from_burden_ratio) * 0.50)) END AS burden_score,
           CASE WHEN j.to_coverage_ratio >= 0.67 THEN 0.00 WHEN j.to_coverage_ratio >= 0.50 THEN -0.03 WHEN j.to_coverage_ratio >= 0.33 THEN -0.06 ELSE -0.08 END AS coverage_penalty,
           (j.from_root_category <> j.to_root_category) AS cross_category,
           (j.from_allergen_set <> j.to_allergen_set) AS allergen_change
    FROM jaccard j
    WHERE j.role_intersection <> ''
      AND (j.flavor_match_score > 0.000 OR j.texture_match_score > 0.000 OR j.method_match_score > 0.000)
  ),
  ranked AS (
    SELECT s.*, (s.to_coverage_ratio < 0.50 OR GREATEST(0.00, LEAST(1.00, (0.70 * s.level_score + 0.30 * s.burden_score + s.coverage_penalty))) < 0.60 OR s.cross_category OR s.allergen_change) AS second_review_required
    FROM scored s
  )
  SELECT
    COUNT(*) AS candidate_rows,
    COUNT(*) FILTER (WHERE second_review_required) AS second_review_rows,
    COUNT(*) FILTER (WHERE NOT second_review_required) AS single_review_rows
  FROM ranked
),
baseline AS (
  SELECT 14::INTEGER AS candidate_rows,
         11::INTEGER AS second_review_rows,
         3::INTEGER AS single_review_rows
)
SELECT
  c.candidate_rows,
  c.second_review_rows,
  c.single_review_rows,
  b.candidate_rows AS baseline_candidate_rows,
  b.second_review_rows AS baseline_second_review_rows,
  b.single_review_rows AS baseline_single_review_rows,
  (c.candidate_rows - b.candidate_rows) AS delta_candidate_rows,
  (c.second_review_rows - b.second_review_rows) AS delta_second_review_rows,
  (c.single_review_rows - b.single_review_rows) AS delta_single_review_rows
FROM current_probe c
CROSS JOIN baseline b;

COMMIT;
