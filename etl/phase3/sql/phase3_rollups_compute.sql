\set ON_ERROR_STOP on

-- NOTE: MVP rollups are target-subtype-only (phase2_priority_foods.target_subtype).
-- NOTE: This is not a full 6-subtype overall FODMAP assessment.

BEGIN;

CREATE TEMP TABLE phase3_source ON COMMIT DROP AS
SELECT source_id
FROM sources
WHERE source_slug = 'internal_rules_v1';

DO $$
DECLARE c INTEGER;
BEGIN
  SELECT COUNT(*) INTO c FROM phase3_source;
  IF c <> 1 THEN
    RAISE EXCEPTION 'source internal_rules_v1 must resolve to exactly one row, got %', c;
  END IF;
END $$;

CREATE TEMP TABLE phase3_target_foods ON COMMIT DROP AS
SELECT
  p.priority_rank,
  p.resolved_food_id AS food_id,
  p.target_subtype,
  p.serving_g_provisional
FROM phase2_priority_foods p
WHERE p.priority_rank BETWEEN 1 AND 42
  AND p.resolved_food_id IS NOT NULL;

DO $$
DECLARE c INTEGER;
BEGIN
  SELECT COUNT(*) INTO c FROM phase3_target_foods;
  IF c <> 42 THEN
    RAISE EXCEPTION 'expected 42 resolved phase3 target foods, got %', c;
  END IF;
END $$;

DELETE FROM food_fodmap_rollups r
USING phase3_target_foods tf, phase3_source s
WHERE r.food_id = tf.food_id
  AND r.source_id = s.source_id;

WITH subtype_map AS (
  SELECT tf.priority_rank, tf.food_id, tf.serving_g_provisional, fst.fodmap_subtype_id
  FROM phase3_target_foods tf
  JOIN fodmap_subtypes fst ON fst.code = tf.target_subtype
),
latest_measurement AS (
  SELECT
    sm.priority_rank,
    m.food_id,
    m.fodmap_subtype_id,
    m.amount_g_per_serving,
    ROW_NUMBER() OVER (
      PARTITION BY sm.priority_rank
      ORDER BY m.observed_at DESC, m.measurement_id DESC
    ) AS rn
  FROM subtype_map sm
  LEFT JOIN food_fodmap_measurements m
    ON m.food_id = sm.food_id
   AND m.fodmap_subtype_id = sm.fodmap_subtype_id
   AND m.is_current = TRUE
),
latest_threshold AS (
  SELECT
    sm.priority_rank,
    t.food_id,
    t.fodmap_subtype_id,
    t.serving_g,
    t.low_max_g,
    t.moderate_max_g,
    ROW_NUMBER() OVER (
      PARTITION BY sm.priority_rank
      ORDER BY t.valid_from DESC, t.threshold_id DESC
    ) AS rn
  FROM subtype_map sm
  LEFT JOIN food_fodmap_thresholds t
    ON t.food_id = sm.food_id
   AND t.fodmap_subtype_id = sm.fodmap_subtype_id
),
resolved AS (
  SELECT
    sm.priority_rank,
    sm.food_id,
    sm.fodmap_subtype_id,
    COALESCE(lt.serving_g, sm.serving_g_provisional) AS serving_g,
    lm.amount_g_per_serving,
    lt.low_max_g,
    lt.moderate_max_g
  FROM subtype_map sm
  LEFT JOIN latest_measurement lm
    ON lm.priority_rank = sm.priority_rank
   AND lm.rn = 1
  LEFT JOIN latest_threshold lt
    ON lt.priority_rank = sm.priority_rank
   AND lt.rn = 1
),
computed AS (
  SELECT
    r.priority_rank,
    r.food_id,
    r.serving_g,
    r.fodmap_subtype_id,
    CASE
      WHEN r.amount_g_per_serving IS NULL OR r.low_max_g IS NULL OR r.moderate_max_g IS NULL THEN 'unknown'::fodmap_level
      WHEN r.amount_g_per_serving <= r.low_max_g THEN 'low'::fodmap_level
      WHEN r.amount_g_per_serving <= r.moderate_max_g THEN 'moderate'::fodmap_level
      ELSE 'high'::fodmap_level
    END AS overall_level
  FROM resolved r
)
INSERT INTO food_fodmap_rollups (
  food_id,
  serving_g,
  overall_level,
  driver_fodmap_subtype_id,
  source_id,
  computed_at
)
SELECT
  c.food_id,
  c.serving_g,
  c.overall_level,
  c.fodmap_subtype_id,
  s.source_id,
  now()
FROM computed c
CROSS JOIN phase3_source s;

SELECT overall_level, COUNT(*) AS row_count
FROM food_fodmap_rollups r
JOIN phase3_source s ON s.source_id = r.source_id
WHERE r.food_id IN (SELECT food_id FROM phase3_target_foods)
GROUP BY overall_level
ORDER BY overall_level;

SELECT tf.priority_rank, tf.target_subtype
FROM phase3_target_foods tf
JOIN food_fodmap_rollups r ON r.food_id = tf.food_id
JOIN phase3_source s ON s.source_id = r.source_id
WHERE r.overall_level = 'unknown'
ORDER BY tf.priority_rank;

COMMIT;
