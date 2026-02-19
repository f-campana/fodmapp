\set ON_ERROR_STOP on

-- NOTE: Phase 3.1a rollups evaluate all six subtypes (fructan, gos, sorbitol,
-- mannitol, fructose excess, lactose) using worst-known severity.
-- NOTE: Coverage is explicitly exposed (known_subtypes_count, coverage_ratio).
-- NOTE: `none` is only allowed with full 6/6 coverage and all subtypes at none.
-- NOTE: For partial coverage where all known subtype levels are none, overall is unknown.

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
  p.serving_g_provisional,
  COALESCE(
    (
      SELECT t.serving_g
      FROM fodmap_subtypes fs
      JOIN food_fodmap_thresholds t
        ON t.food_id = p.resolved_food_id
       AND t.fodmap_subtype_id = fs.fodmap_subtype_id
      WHERE fs.code = p.target_subtype
      ORDER BY t.valid_from DESC, t.threshold_id DESC
      LIMIT 1
    ),
    p.serving_g_provisional
  ) AS rollup_serving_g
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

CREATE TEMP TABLE stg_default_thresholds (
  subtype_code TEXT,
  low_max_g NUMERIC(12,6),
  moderate_max_g NUMERIC(12,6),
  source_slug TEXT,
  citation_ref TEXT,
  derivation_method TEXT,
  valid_from DATE,
  notes TEXT
) ON COMMIT DROP;

\copy stg_default_thresholds (subtype_code,low_max_g,moderate_max_g,source_slug,citation_ref,derivation_method,valid_from,notes) FROM 'etl/phase3/data/phase3_rollup_default_thresholds_v1.csv' WITH (FORMAT csv, HEADER true)

DO $$
DECLARE
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count
  FROM stg_default_thresholds;
  IF bad_count <> 6 THEN
    RAISE EXCEPTION 'default thresholds must contain exactly 6 rows, got %', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_default_thresholds
  WHERE subtype_code NOT IN ('fructan', 'gos', 'sorbitol', 'mannitol', 'fructose', 'lactose');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'default thresholds contain unknown subtype_code';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_default_thresholds
  WHERE source_slug <> 'internal_rules_v1'
     OR low_max_g IS NULL
     OR moderate_max_g IS NULL
     OR low_max_g <= 0
     OR moderate_max_g <= 0
     OR low_max_g > moderate_max_g
     OR citation_ref IS NULL
     OR citation_ref = ''
     OR derivation_method IS NULL
     OR derivation_method = '';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'default thresholds fail source/order/citation/derivation constraints';
  END IF;
END $$;

DELETE FROM food_fodmap_rollups r
USING phase3_target_foods tf, phase3_source s
WHERE r.food_id = tf.food_id
  AND r.source_id = s.source_id;

DROP VIEW IF EXISTS v_phase3_rollup_subtype_levels_latest;
DROP VIEW IF EXISTS v_phase3_rollups_latest_full;

DROP TABLE IF EXISTS phase3_subtype_levels_snapshot;
DROP TABLE IF EXISTS phase3_rollups_snapshot;

CREATE TABLE phase3_subtype_levels_snapshot AS
WITH subtype_codes AS (
  SELECT unnest(ARRAY['fructan','gos','sorbitol','mannitol','fructose','lactose'])::TEXT AS subtype_code
),
food_subtypes AS (
  SELECT
    tf.priority_rank,
    tf.food_id,
    tf.rollup_serving_g,
    sc.subtype_code,
    fs.fodmap_subtype_id
  FROM phase3_target_foods tf
  CROSS JOIN subtype_codes sc
  LEFT JOIN fodmap_subtypes fs ON fs.code = sc.subtype_code
),
latest_measurements AS (
  SELECT
    ffm.food_id,
    fst.code AS subtype_code,
    ffm.measurement_id,
    ffm.source_id,
    ffm.comparator,
    ffm.amount_g_per_100g,
    ffm.amount_g_per_serving,
    ffm.serving_g,
    ffm.observed_at,
    ROW_NUMBER() OVER (
      PARTITION BY ffm.food_id, fst.code
      ORDER BY ffm.observed_at DESC, ffm.measurement_id DESC
    ) AS rn
  FROM food_fodmap_measurements ffm
  JOIN fodmap_subtypes fst ON fst.fodmap_subtype_id = ffm.fodmap_subtype_id
  WHERE ffm.is_current = TRUE
),
lactose_latest AS (
  SELECT
    x.food_id,
    x.source_id,
    x.comparator,
    x.amount_value,
    x.observed_on
  FROM (
    SELECT
      fno.food_id,
      fno.source_id,
      fno.comparator,
      fno.amount_value,
      COALESCE(fno.observed_at, fno.effective_from) AS observed_on,
      ROW_NUMBER() OVER (
        PARTITION BY fno.food_id
        ORDER BY COALESCE(fno.observed_at, fno.effective_from) DESC, fno.created_at DESC, fno.observation_id DESC
      ) AS rn
    FROM food_nutrient_observations fno
    JOIN nutrient_definitions nd ON nd.nutrient_id = fno.nutrient_id
    JOIN sources s ON s.source_id = fno.source_id
    WHERE s.source_slug = 'ciqual_2025'
      AND nd.nutrient_code = 'CIQUAL_32410'
      AND fno.basis = 'per_100g'
      AND fno.comparator IN ('eq', 'lt', 'lte')
      AND fno.amount_value IS NOT NULL
  ) x
  WHERE x.rn = 1
),
polyols_latest AS (
  SELECT
    x.food_id,
    x.source_id,
    x.comparator,
    x.amount_value,
    x.observed_on
  FROM (
    SELECT
      fno.food_id,
      fno.source_id,
      fno.comparator,
      fno.amount_value,
      COALESCE(fno.observed_at, fno.effective_from) AS observed_on,
      ROW_NUMBER() OVER (
        PARTITION BY fno.food_id
        ORDER BY COALESCE(fno.observed_at, fno.effective_from) DESC, fno.created_at DESC, fno.observation_id DESC
      ) AS rn
    FROM food_nutrient_observations fno
    JOIN nutrient_definitions nd ON nd.nutrient_id = fno.nutrient_id
    JOIN sources s ON s.source_id = fno.source_id
    WHERE s.source_slug = 'ciqual_2025'
      AND nd.nutrient_code = 'CIQUAL_34000'
      AND fno.basis = 'per_100g'
      AND fno.comparator IN ('eq', 'lt', 'lte')
      AND fno.amount_value IS NOT NULL
  ) x
  WHERE x.rn = 1
),
fructose_excess_latest AS (
  SELECT
    v.food_id,
    s.source_id,
    v.excess_fructose_g_per_100g,
    v.fructose_comparator,
    v.glucose_comparator,
    v.observed_on
  FROM v_food_excess_fructose_latest v
  JOIN sources s ON s.source_slug = v.source_slug
  WHERE v.derivation_status = 'computed'
    AND v.excess_fructose_g_per_100g IS NOT NULL
),
food_threshold_latest AS (
  SELECT
    t.food_id,
    fs.code AS subtype_code,
    t.low_max_g,
    t.moderate_max_g,
    t.source_id,
    ROW_NUMBER() OVER (
      PARTITION BY t.food_id, fs.code
      ORDER BY t.valid_from DESC, t.threshold_id DESC
    ) AS rn
  FROM food_fodmap_thresholds t
  JOIN fodmap_subtypes fs ON fs.fodmap_subtype_id = t.fodmap_subtype_id
),
signals_raw AS (
  SELECT
    f.priority_rank,
    f.food_id,
    f.subtype_code,
    f.fodmap_subtype_id,
    f.rollup_serving_g,
    CASE
      WHEN lm.rn = 1
           AND lm.amount_g_per_100g IS NOT NULL
        THEN lm.amount_g_per_100g * f.rollup_serving_g / 100.0
      WHEN lm.rn = 1
           AND lm.amount_g_per_serving IS NOT NULL
           AND lm.serving_g IS NOT NULL
           AND lm.serving_g > 0
        THEN lm.amount_g_per_serving * f.rollup_serving_g / lm.serving_g
      WHEN lm.rn = 1
           AND lm.amount_g_per_serving IS NOT NULL
        THEN lm.amount_g_per_serving
      ELSE NULL
    END AS explicit_amount_g_per_serving,
    CASE
      WHEN lm.rn = 1
           AND (lm.amount_g_per_100g IS NOT NULL OR lm.amount_g_per_serving IS NOT NULL)
        THEN lm.comparator
      ELSE NULL
    END AS explicit_comparator,
    CASE
      WHEN lm.rn = 1
           AND (lm.amount_g_per_100g IS NOT NULL OR lm.amount_g_per_serving IS NOT NULL)
        THEN lm.source_id
      ELSE NULL
    END AS explicit_source_id,
    fx.excess_fructose_g_per_100g,
    fx.fructose_comparator,
    fx.glucose_comparator,
    fx.source_id AS fructose_source_id,
    lac.amount_value AS lactose_amount_value,
    lac.comparator AS lactose_comparator,
    lac.source_id AS lactose_source_id,
    pol.amount_value AS polyols_amount_value,
    pol.comparator AS polyols_comparator,
    pol.source_id AS polyols_source_id,
    COALESCE(ft.low_max_g, dt.low_max_g) AS low_max_g,
    COALESCE(ft.moderate_max_g, dt.moderate_max_g) AS moderate_max_g,
    CASE
      WHEN ft.rn = 1 THEN 'food_specific'
      ELSE 'global_default'
    END AS threshold_source,
    CASE
      WHEN ft.rn = 1 THEN FALSE
      ELSE TRUE
    END AS is_default_threshold,
    COALESCE(ft.source_id, src.source_id) AS threshold_source_id,
    dt.citation_ref AS default_threshold_citation_ref,
    dt.derivation_method AS default_threshold_derivation_method
  FROM food_subtypes f
  LEFT JOIN latest_measurements lm
    ON lm.food_id = f.food_id
   AND lm.subtype_code = f.subtype_code
   AND lm.rn = 1
  LEFT JOIN fructose_excess_latest fx
    ON fx.food_id = f.food_id
   AND f.subtype_code = 'fructose'
  LEFT JOIN lactose_latest lac
    ON lac.food_id = f.food_id
   AND f.subtype_code = 'lactose'
  LEFT JOIN polyols_latest pol
    ON pol.food_id = f.food_id
   AND f.subtype_code IN ('sorbitol','mannitol')
  LEFT JOIN food_threshold_latest ft
    ON ft.food_id = f.food_id
   AND ft.subtype_code = f.subtype_code
   AND ft.rn = 1
  JOIN stg_default_thresholds dt
    ON dt.subtype_code = f.subtype_code
  CROSS JOIN phase3_source src
),
signals AS (
  SELECT
    r.priority_rank,
    r.food_id,
    r.subtype_code,
    r.fodmap_subtype_id,
    r.rollup_serving_g,
    CASE
      WHEN r.explicit_amount_g_per_serving IS NOT NULL
        THEN r.explicit_amount_g_per_serving
      WHEN r.subtype_code = 'fructose'
           AND r.excess_fructose_g_per_100g IS NOT NULL
        THEN r.excess_fructose_g_per_100g * r.rollup_serving_g / 100.0
      WHEN r.subtype_code = 'lactose'
           AND r.lactose_amount_value IS NOT NULL
        THEN r.lactose_amount_value * r.rollup_serving_g / 100.0
      WHEN r.subtype_code IN ('sorbitol','mannitol')
           AND r.polyols_amount_value IS NOT NULL
        THEN r.polyols_amount_value * r.rollup_serving_g / 100.0
      ELSE NULL
    END AS amount_g_per_serving,
    CASE
      WHEN r.explicit_amount_g_per_serving IS NOT NULL
        THEN r.explicit_comparator
      WHEN r.subtype_code = 'fructose'
           AND r.excess_fructose_g_per_100g IS NOT NULL
        THEN CASE
          WHEN r.fructose_comparator = 'eq' AND r.glucose_comparator = 'eq' THEN 'eq'::comparator_code
          ELSE 'lte'::comparator_code
        END
      WHEN r.subtype_code = 'lactose'
           AND r.lactose_amount_value IS NOT NULL
        THEN r.lactose_comparator
      WHEN r.subtype_code IN ('sorbitol','mannitol')
           AND r.polyols_amount_value IS NOT NULL
        THEN r.polyols_comparator
      ELSE NULL
    END AS comparator,
    CASE
      WHEN r.explicit_amount_g_per_serving IS NOT NULL
        THEN r.explicit_source_id
      WHEN r.subtype_code = 'fructose'
           AND r.excess_fructose_g_per_100g IS NOT NULL
        THEN r.fructose_source_id
      WHEN r.subtype_code = 'lactose'
           AND r.lactose_amount_value IS NOT NULL
        THEN r.lactose_source_id
      WHEN r.subtype_code IN ('sorbitol','mannitol')
           AND r.polyols_amount_value IS NOT NULL
        THEN r.polyols_source_id
      ELSE NULL
    END AS signal_source_id,
    CASE
      WHEN r.explicit_amount_g_per_serving IS NOT NULL
        THEN 'explicit_measurement'
      WHEN r.subtype_code = 'fructose'
           AND r.excess_fructose_g_per_100g IS NOT NULL
        THEN 'excess_fructose_derived'
      WHEN r.subtype_code = 'lactose'
           AND r.lactose_amount_value IS NOT NULL
        THEN 'ciqual_lactose'
      WHEN r.subtype_code IN ('sorbitol','mannitol')
           AND r.polyols_amount_value IS NOT NULL
        THEN 'ciqual_total_polyols_proxy'
      ELSE 'none'
    END AS signal_source_kind,
    CASE
      WHEN r.subtype_code IN ('sorbitol','mannitol')
           AND r.explicit_amount_g_per_serving IS NULL
           AND r.polyols_amount_value IS NOT NULL
        THEN TRUE
      ELSE FALSE
    END AS is_polyol_proxy,
    r.low_max_g,
    r.moderate_max_g,
    r.threshold_source,
    r.is_default_threshold,
    r.threshold_source_id,
    r.default_threshold_citation_ref,
    r.default_threshold_derivation_method
  FROM signals_raw r
),
signals_with_levels AS (
  SELECT
    s.*,
    CASE
      WHEN s.amount_g_per_serving IS NULL
        THEN 'unknown'::fodmap_level
      WHEN s.comparator = 'eq'::comparator_code
           AND s.amount_g_per_serving = 0
        THEN 'none'::fodmap_level
      WHEN s.amount_g_per_serving <= s.low_max_g
        THEN 'low'::fodmap_level
      WHEN s.amount_g_per_serving <= s.moderate_max_g
        THEN 'moderate'::fodmap_level
      ELSE 'high'::fodmap_level
    END AS subtype_level
  FROM signals s
),
ranked AS (
  SELECT
    s.*,
    CASE s.subtype_level
      WHEN 'unknown' THEN 0
      WHEN 'none' THEN 1
      WHEN 'low' THEN 2
      WHEN 'moderate' THEN 3
      WHEN 'high' THEN 4
    END AS severity_rank,
    CASE
      WHEN s.amount_g_per_serving IS NULL OR s.moderate_max_g IS NULL OR s.moderate_max_g = 0 THEN NULL
      ELSE s.amount_g_per_serving / s.moderate_max_g
    END AS burden_ratio
  FROM signals_with_levels s
)
SELECT * FROM ranked;

CREATE TABLE phase3_rollups_snapshot AS
WITH coverage AS (
  SELECT
    priority_rank,
    food_id,
    MAX(rollup_serving_g) AS rollup_serving_g,
    COUNT(*) FILTER (WHERE subtype_level <> 'unknown') AS known_subtypes_count,
    BOOL_AND(subtype_level = 'none') FILTER (WHERE subtype_level <> 'unknown') AS all_known_none,
    MAX(severity_rank) AS worst_severity_rank
  FROM phase3_subtype_levels_snapshot
  GROUP BY priority_rank, food_id
),
driver_candidates AS (
  SELECT
    w.priority_rank,
    w.food_id,
    w.subtype_code,
    w.fodmap_subtype_id,
    w.severity_rank,
    w.burden_ratio,
    ROW_NUMBER() OVER (
      PARTITION BY w.priority_rank
      ORDER BY w.severity_rank DESC, w.burden_ratio DESC NULLS LAST, w.subtype_code ASC
    ) AS rn
  FROM phase3_subtype_levels_snapshot w
  JOIN coverage c
    ON c.priority_rank = w.priority_rank
   AND c.food_id = w.food_id
  WHERE w.severity_rank = c.worst_severity_rank
)
SELECT
  c.priority_rank,
  c.food_id,
  c.rollup_serving_g,
  CASE
    WHEN c.known_subtypes_count = 0 THEN 'unknown'::fodmap_level
    WHEN c.known_subtypes_count < 6 AND c.all_known_none THEN 'unknown'::fodmap_level
    WHEN c.known_subtypes_count = 6 AND c.all_known_none THEN 'none'::fodmap_level
    WHEN c.worst_severity_rank >= 4 THEN 'high'::fodmap_level
    WHEN c.worst_severity_rank = 3 THEN 'moderate'::fodmap_level
    WHEN c.worst_severity_rank = 2 THEN 'low'::fodmap_level
    WHEN c.worst_severity_rank = 1 THEN 'low'::fodmap_level
    ELSE 'unknown'::fodmap_level
  END AS overall_level,
  CASE
    WHEN c.known_subtypes_count = 0 THEN NULL
    WHEN c.known_subtypes_count < 6 AND c.all_known_none THEN NULL
    WHEN c.known_subtypes_count = 6 AND c.all_known_none THEN NULL
    ELSE dc.fodmap_subtype_id
  END AS driver_fodmap_subtype_id,
  c.known_subtypes_count,
  (c.known_subtypes_count::NUMERIC / 6.0)::NUMERIC(6,4) AS coverage_ratio
FROM coverage c
LEFT JOIN driver_candidates dc
  ON dc.priority_rank = c.priority_rank
 AND dc.food_id = c.food_id
 AND dc.rn = 1;

INSERT INTO food_fodmap_rollups (
  food_id,
  serving_g,
  overall_level,
  driver_fodmap_subtype_id,
  source_id,
  computed_at
)
SELECT
  rw.food_id,
  rw.rollup_serving_g,
  rw.overall_level,
  rw.driver_fodmap_subtype_id,
  src.source_id,
  now()
FROM phase3_rollups_snapshot rw
CROSS JOIN phase3_source src;

CREATE VIEW v_phase3_rollup_subtype_levels_latest AS
WITH src AS (
  SELECT source_id FROM sources WHERE source_slug = 'internal_rules_v1'
),
latest_rollups AS (
  SELECT DISTINCT ON (r.food_id)
    r.food_id,
    r.computed_at
  FROM food_fodmap_rollups r
  JOIN src s ON s.source_id = r.source_id
  JOIN phase2_priority_foods p ON p.resolved_food_id = r.food_id
  WHERE p.priority_rank BETWEEN 1 AND 42
  ORDER BY r.food_id, r.computed_at DESC
)
SELECT
  w.priority_rank,
  w.food_id,
  w.rollup_serving_g,
  w.subtype_code,
  w.fodmap_subtype_id,
  w.amount_g_per_serving,
  w.comparator,
  w.low_max_g,
  w.moderate_max_g,
  w.subtype_level,
  w.signal_source_kind,
  ss.source_slug AS signal_source_slug,
  w.threshold_source,
  ts.source_slug AS threshold_source_slug,
  w.is_default_threshold,
  w.is_polyol_proxy,
  w.default_threshold_citation_ref,
  w.default_threshold_derivation_method,
  w.severity_rank,
  w.burden_ratio,
  lr.computed_at
FROM phase3_subtype_levels_snapshot w
JOIN latest_rollups lr ON lr.food_id = w.food_id
LEFT JOIN sources ss ON ss.source_id = w.signal_source_id
LEFT JOIN sources ts ON ts.source_id = w.threshold_source_id;

CREATE VIEW v_phase3_rollups_latest_full AS
WITH src AS (
  SELECT source_id FROM sources WHERE source_slug = 'internal_rules_v1'
)
SELECT DISTINCT ON (p.priority_rank)
  p.priority_rank,
  r.food_id,
  r.serving_g AS rollup_serving_g,
  r.overall_level,
  fst.code AS driver_subtype_code,
  rw.known_subtypes_count,
  rw.coverage_ratio,
  r.computed_at,
  s.source_slug
FROM phase2_priority_foods p
JOIN food_fodmap_rollups r ON r.food_id = p.resolved_food_id
JOIN src x ON x.source_id = r.source_id
JOIN sources s ON s.source_id = r.source_id
LEFT JOIN fodmap_subtypes fst ON fst.fodmap_subtype_id = r.driver_fodmap_subtype_id
LEFT JOIN phase3_rollups_snapshot rw
  ON rw.priority_rank = p.priority_rank
 AND rw.food_id = r.food_id
WHERE p.priority_rank BETWEEN 1 AND 42
ORDER BY p.priority_rank, r.computed_at DESC;

-- Diagnostic outputs (non-blocking):
-- Pre-3.1a baseline diagnostics were 1/6:21, 3/6:6, 4/6:10, 5/6:5 from linked signals
-- before full rollup wiring. Coverage only increases when new linked signals
-- (additional subtype measurements and/or nutrient linkage) are available.
SELECT
  overall_level,
  COUNT(*) AS row_count
FROM v_phase3_rollups_latest_full
GROUP BY overall_level
ORDER BY overall_level;

SELECT
  known_subtypes_count,
  COUNT(*) AS foods
FROM v_phase3_rollups_latest_full
GROUP BY known_subtypes_count
ORDER BY known_subtypes_count;

COMMIT;
