\set ON_ERROR_STOP on

-- Phase 3 SQL MVP hard checks.

BEGIN;

CREATE TEMP TABLE stg_exemptions (
  priority_rank INTEGER,
  trait_domain TEXT,
  reason TEXT
) ON COMMIT DROP;

\copy stg_exemptions (priority_rank,trait_domain,reason) FROM '/Users/fabiencampana/Documents/Fodmap/etl/phase3/data/phase3_trait_exemptions_v1.csv' WITH (FORMAT csv, HEADER true)

WITH target_foods AS (
  SELECT p.priority_rank, p.resolved_food_id AS food_id
  FROM phase2_priority_foods p
  WHERE p.priority_rank BETWEEN 1 AND 42
),
role_counts AS (
  SELECT tf.priority_rank, COUNT(r.role_code) AS c
  FROM target_foods tf
  LEFT JOIN food_culinary_roles r ON r.food_id = tf.food_id
  GROUP BY tf.priority_rank
),
flavor_counts AS (
  SELECT tf.priority_rank, COUNT(f.flavor_code) AS c
  FROM target_foods tf
  LEFT JOIN food_flavor_profiles f ON f.food_id = tf.food_id
  GROUP BY tf.priority_rank
),
texture_counts AS (
  SELECT tf.priority_rank, COUNT(t.texture_code) AS c
  FROM target_foods tf
  LEFT JOIN food_texture_profiles t ON t.food_id = tf.food_id
  GROUP BY tf.priority_rank
),
behavior_counts AS (
  SELECT tf.priority_rank, COUNT(b.behavior_code) AS c
  FROM target_foods tf
  LEFT JOIN food_cooking_behaviors b ON b.food_id = tf.food_id
  GROUP BY tf.priority_rank
),
cuisine_counts AS (
  SELECT tf.priority_rank, COUNT(c.cuisine_code) AS c
  FROM target_foods tf
  LEFT JOIN food_cuisine_affinities c ON c.food_id = tf.food_id
  GROUP BY tf.priority_rank
)
SELECT
  tf.priority_rank,
  rc.c AS role_count,
  fc.c AS flavor_count,
  tc.c AS texture_count,
  bc.c AS behavior_count,
  cc.c AS cuisine_count
FROM target_foods tf
JOIN role_counts rc USING(priority_rank)
JOIN flavor_counts fc USING(priority_rank)
JOIN texture_counts tc USING(priority_rank)
JOIN behavior_counts bc USING(priority_rank)
JOIN cuisine_counts cc USING(priority_rank)
ORDER BY tf.priority_rank;

DO $$
DECLARE
  bad_count INTEGER;
  source_internal UUID;
  rank2_food UUID;
  unknown_count INTEGER;
  unknown_other_count INTEGER;
  mvp_rules_count INTEGER;
  mvp_draft_count INTEGER;
  mvp_context_count INTEGER;
  mvp_score_count INTEGER;
  rank2_rule_count INTEGER;
  ratio_or_score_violations INTEGER;
  r10_from NUMERIC;
  r10_to NUMERIC;
BEGIN
  SELECT COUNT(*) INTO bad_count FROM stg_exemptions;
  IF bad_count <> 0 THEN
    RAISE EXCEPTION 'MVP exemption policy failed: expected 0 rows, got %', bad_count;
  END IF;

  SELECT source_id INTO source_internal
  FROM sources
  WHERE source_slug = 'internal_rules_v1';

  IF source_internal IS NULL THEN
    RAISE EXCEPTION 'missing source internal_rules_v1';
  END IF;

  -- Trait minima per food (42 foods, no exemptions in MVP).
  WITH target_foods AS (
    SELECT p.priority_rank, p.resolved_food_id AS food_id
    FROM phase2_priority_foods p
    WHERE p.priority_rank BETWEEN 1 AND 42
  ),
  role_counts AS (
    SELECT tf.priority_rank, COUNT(r.role_code) AS c
    FROM target_foods tf
    LEFT JOIN food_culinary_roles r ON r.food_id = tf.food_id
    GROUP BY tf.priority_rank
  ),
  flavor_counts AS (
    SELECT tf.priority_rank, COUNT(f.flavor_code) AS c
    FROM target_foods tf
    LEFT JOIN food_flavor_profiles f ON f.food_id = tf.food_id
    GROUP BY tf.priority_rank
  ),
  texture_counts AS (
    SELECT tf.priority_rank, COUNT(t.texture_code) AS c
    FROM target_foods tf
    LEFT JOIN food_texture_profiles t ON t.food_id = tf.food_id
    GROUP BY tf.priority_rank
  ),
  behavior_counts AS (
    SELECT tf.priority_rank, COUNT(b.behavior_code) AS c
    FROM target_foods tf
    LEFT JOIN food_cooking_behaviors b ON b.food_id = tf.food_id
    GROUP BY tf.priority_rank
  ),
  cuisine_counts AS (
    SELECT tf.priority_rank, COUNT(c.cuisine_code) AS c
    FROM target_foods tf
    LEFT JOIN food_cuisine_affinities c ON c.food_id = tf.food_id
    GROUP BY tf.priority_rank
  )
  SELECT COUNT(*) INTO bad_count
  FROM role_counts rc
  JOIN flavor_counts fc USING(priority_rank)
  JOIN texture_counts tc USING(priority_rank)
  JOIN behavior_counts bc USING(priority_rank)
  JOIN cuisine_counts cc USING(priority_rank)
  WHERE rc.c < 1 OR fc.c < 2 OR tc.c < 1 OR bc.c < 1 OR cc.c < 1;

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'trait coverage minima failed for % foods', bad_count;
  END IF;

  -- Rollup checks (source-scoped, target-subtype-only MVP behavior).
  SELECT COUNT(*) INTO bad_count
  FROM food_fodmap_rollups r
  JOIN phase2_priority_foods p ON p.resolved_food_id = r.food_id
  WHERE p.priority_rank BETWEEN 1 AND 42
    AND r.source_id = source_internal;

  IF bad_count <> 42 THEN
    RAISE EXCEPTION 'rollup row count failed: expected 42, got %', bad_count;
  END IF;

  SELECT resolved_food_id INTO rank2_food
  FROM phase2_priority_foods
  WHERE priority_rank = 2;

  SELECT COUNT(*) INTO unknown_count
  FROM food_fodmap_rollups
  WHERE source_id = source_internal
    AND overall_level = 'unknown';

  IF unknown_count <> 1 THEN
    RAISE EXCEPTION 'unknown rollup count failed: expected 1, got %', unknown_count;
  END IF;

  SELECT COUNT(*) INTO unknown_other_count
  FROM food_fodmap_rollups
  WHERE source_id = source_internal
    AND overall_level = 'unknown'
    AND food_id <> rank2_food;

  IF unknown_other_count <> 0 THEN
    RAISE EXCEPTION 'unknown rollup scope failed: only rank2 may be unknown';
  END IF;

  -- Swap rule checks (MVP batch = 12, all draft).
  SELECT COUNT(*) INTO mvp_rules_count
  FROM swap_rules
  WHERE source_id = source_internal
    AND notes = 'phase3_mvp_rule';

  IF mvp_rules_count <> 12 THEN
    RAISE EXCEPTION 'MVP swap rule count failed: expected 12, got %', mvp_rules_count;
  END IF;

  SELECT COUNT(*) INTO mvp_draft_count
  FROM swap_rules
  WHERE source_id = source_internal
    AND notes = 'phase3_mvp_rule'
    AND status = 'draft';

  IF mvp_draft_count <> 12 THEN
    RAISE EXCEPTION 'MVP draft status count failed: expected 12, got %', mvp_draft_count;
  END IF;

  SELECT COUNT(*) INTO mvp_context_count
  FROM swap_rule_contexts c
  JOIN swap_rules r ON r.swap_rule_id = c.swap_rule_id
  WHERE r.source_id = source_internal
    AND r.notes = 'phase3_mvp_rule';

  IF mvp_context_count <> 12 THEN
    RAISE EXCEPTION 'MVP context count failed: expected 12, got %', mvp_context_count;
  END IF;

  SELECT COUNT(*) INTO mvp_score_count
  FROM swap_rule_scores s
  JOIN swap_rules r ON r.swap_rule_id = s.swap_rule_id
  WHERE r.source_id = source_internal
    AND r.notes = 'phase3_mvp_rule';

  IF mvp_score_count <> 12 THEN
    RAISE EXCEPTION 'MVP score count failed: expected 12, got %', mvp_score_count;
  END IF;

  SELECT COUNT(*) INTO rank2_rule_count
  FROM swap_rules r
  JOIN phase2_priority_foods p_from ON p_from.resolved_food_id = r.from_food_id
  JOIN phase2_priority_foods p_to   ON p_to.resolved_food_id = r.to_food_id
  WHERE r.source_id = source_internal
    AND r.notes = 'phase3_mvp_rule'
    AND (p_from.priority_rank = 2 OR p_to.priority_rank = 2);

  IF rank2_rule_count <> 0 THEN
    RAISE EXCEPTION 'rank2 exclusion failed: found % MVP rules touching rank2', rank2_rule_count;
  END IF;

  SELECT COUNT(*) INTO ratio_or_score_violations
  FROM swap_rules r
  JOIN swap_rule_scores s ON s.swap_rule_id = r.swap_rule_id
  WHERE r.source_id = source_internal
    AND r.notes = 'phase3_mvp_rule'
    AND (
      r.min_ratio <= 0 OR r.max_ratio <= 0 OR r.default_ratio <= 0
      OR r.min_ratio > r.default_ratio OR r.default_ratio > r.max_ratio
      OR s.fodmap_safety_score < 0 OR s.fodmap_safety_score > 1
      OR s.flavor_match_score < 0 OR s.flavor_match_score > 1
      OR s.texture_match_score < 0 OR s.texture_match_score > 1
      OR s.method_match_score < 0 OR s.method_match_score > 1
      OR s.availability_fr_score < 0 OR s.availability_fr_score > 1
      OR s.cost_fr_score < 0 OR s.cost_fr_score > 1
    );

  IF ratio_or_score_violations <> 0 THEN
    RAISE EXCEPTION 'ratio/score validation failed on % MVP rules', ratio_or_score_violations;
  END IF;

  -- Rule 10 safety sanity: 28 -> 29 must be non-regressive at target-subtype serving burden.
  SELECT m.amount_g_per_serving INTO r10_from
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

  SELECT m.amount_g_per_serving INTO r10_to
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

  IF r10_from IS NULL OR r10_to IS NULL OR r10_to > r10_from THEN
    RAISE EXCEPTION 'R10 non-regression check failed: expected to <= from, got % <= %', r10_to, r10_from;
  END IF;
END $$;

SELECT
  r.swap_rule_id,
  p_from.priority_rank AS from_rank,
  p_to.priority_rank AS to_rank,
  r.rule_kind,
  r.status,
  s.overall_score,
  s.fodmap_safety_score,
  s.flavor_match_score,
  s.texture_match_score,
  s.method_match_score
FROM swap_rules r
JOIN swap_rule_scores s ON s.swap_rule_id = r.swap_rule_id
JOIN phase2_priority_foods p_from ON p_from.resolved_food_id = r.from_food_id
JOIN phase2_priority_foods p_to ON p_to.resolved_food_id = r.to_food_id
JOIN sources src ON src.source_id = r.source_id
WHERE src.source_slug = 'internal_rules_v1'
  AND r.notes = 'phase3_mvp_rule'
ORDER BY s.overall_score DESC, from_rank, to_rank;

COMMIT;
