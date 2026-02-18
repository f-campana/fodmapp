\set ON_ERROR_STOP on

-- Phase 2.3 batch10 mini-ingestion.
-- Scope-locked to priority ranks: 1,2,4,5,14,15,34,39,40,41
-- Data files:
--   /Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_batch10_measurements.csv
--   /Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_batch10_thresholds.csv

BEGIN;

CREATE TEMP TABLE phase2_batch10_measurements_stg (
  priority_rank INTEGER PRIMARY KEY,
  food_id TEXT,
  fodmap_subtype TEXT NOT NULL,
  amount_per_100g NUMERIC(12,6) NOT NULL,
  comparator comparator_code NOT NULL,
  serving_g NUMERIC(8,2) NOT NULL,
  amount_per_serving NUMERIC(12,6) NOT NULL,
  source_slug TEXT NOT NULL,
  citation_ref TEXT NOT NULL,
  evidence_tier evidence_tier NOT NULL,
  confidence_score NUMERIC(4,3) NOT NULL,
  observed_at DATE NOT NULL,
  method TEXT NOT NULL,
  notes TEXT
) ON COMMIT DROP;

CREATE TEMP TABLE phase2_batch10_thresholds_stg (
  priority_rank INTEGER PRIMARY KEY,
  food_id TEXT,
  fodmap_subtype TEXT NOT NULL,
  serving_g NUMERIC(8,2) NOT NULL,
  low_max_g NUMERIC(12,6) NOT NULL,
  moderate_max_g NUMERIC(12,6) NOT NULL,
  source_slug TEXT NOT NULL,
  citation_ref TEXT NOT NULL,
  evidence_tier evidence_tier NOT NULL,
  confidence_score NUMERIC(4,3) NOT NULL,
  valid_from DATE NOT NULL,
  notes TEXT
) ON COMMIT DROP;

\copy phase2_batch10_measurements_stg (priority_rank, food_id, fodmap_subtype, amount_per_100g, comparator, serving_g, amount_per_serving, source_slug, citation_ref, evidence_tier, confidence_score, observed_at, method, notes) FROM '/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_batch10_measurements.csv' WITH (FORMAT csv, HEADER true)
\copy phase2_batch10_thresholds_stg (priority_rank, food_id, fodmap_subtype, serving_g, low_max_g, moderate_max_g, source_slug, citation_ref, evidence_tier, confidence_score, valid_from, notes) FROM '/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_batch10_thresholds.csv' WITH (FORMAT csv, HEADER true)

DO $$
DECLARE
  v_expected_count INTEGER := 10;
BEGIN
  IF (SELECT COUNT(*) FROM phase2_batch10_measurements_stg) <> v_expected_count THEN
    RAISE EXCEPTION 'batch10 measurements row count mismatch: expected %, got %',
      v_expected_count, (SELECT COUNT(*) FROM phase2_batch10_measurements_stg);
  END IF;

  IF (SELECT COUNT(*) FROM phase2_batch10_thresholds_stg) <> v_expected_count THEN
    RAISE EXCEPTION 'batch10 thresholds row count mismatch: expected %, got %',
      v_expected_count, (SELECT COUNT(*) FROM phase2_batch10_thresholds_stg);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM phase2_batch10_measurements_stg
    WHERE priority_rank NOT IN (1,2,4,5,14,15,34,39,40,41)
  ) THEN
    RAISE EXCEPTION 'batch10 measurements includes out-of-scope priority ranks';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM phase2_batch10_thresholds_stg
    WHERE priority_rank NOT IN (1,2,4,5,14,15,34,39,40,41)
  ) THEN
    RAISE EXCEPTION 'batch10 thresholds includes out-of-scope priority ranks';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM phase2_batch10_measurements_stg
    WHERE trim(citation_ref) = '' OR trim(method) = ''
  ) THEN
    RAISE EXCEPTION 'batch10 measurements has missing citation_ref or method';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM phase2_batch10_thresholds_stg
    WHERE trim(citation_ref) = ''
  ) THEN
    RAISE EXCEPTION 'batch10 thresholds has missing citation_ref';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM phase2_batch10_measurements_stg
    WHERE method <> 'literature'
  ) THEN
    RAISE EXCEPTION 'batch10 measurements method must be literature';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM phase2_batch10_thresholds_stg
    WHERE source_slug <> 'monash_app_v4_reference'
  ) THEN
    RAISE EXCEPTION 'batch10 thresholds source_slug must be monash_app_v4_reference';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM phase2_batch10_measurements_stg
    WHERE abs(amount_per_serving - round((amount_per_100g * serving_g) / 100.0, 6)) > 0.000001
  ) THEN
    RAISE EXCEPTION 'batch10 measurements amount_per_serving mismatch against amount_per_100g * serving_g / 100';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM phase2_batch10_thresholds_stg
    WHERE low_max_g > moderate_max_g
  ) THEN
    RAISE EXCEPTION 'batch10 thresholds invalid: low_max_g > moderate_max_g';
  END IF;

  IF (SELECT COUNT(*) FROM phase2_priority_foods WHERE priority_rank IN (1,2,4,5,14,15,34,39,40,41) AND resolved_food_id IS NOT NULL) <> v_expected_count THEN
    RAISE EXCEPTION 'phase2_priority_foods preflight failed: locked cohort is not fully resolved';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM phase2_batch10_measurements_stg AS m
    LEFT JOIN phase2_priority_foods AS p
      ON p.priority_rank = m.priority_rank
    WHERE p.priority_rank IS NULL
       OR p.resolved_food_id IS NULL
       OR p.target_subtype <> m.fodmap_subtype
       OR (
         NULLIF(m.food_id, '') IS NOT NULL
         AND p.resolved_food_id::TEXT <> m.food_id
       )
  ) THEN
    RAISE EXCEPTION 'batch10 measurements failed priority_rank/food_id/target_subtype lock checks';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM phase2_batch10_thresholds_stg AS t
    LEFT JOIN phase2_priority_foods AS p
      ON p.priority_rank = t.priority_rank
    WHERE p.priority_rank IS NULL
       OR p.resolved_food_id IS NULL
       OR p.target_subtype <> t.fodmap_subtype
       OR (
         NULLIF(t.food_id, '') IS NOT NULL
         AND p.resolved_food_id::TEXT <> t.food_id
       )
  ) THEN
    RAISE EXCEPTION 'batch10 thresholds failed priority_rank/food_id/target_subtype lock checks';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM phase2_batch10_measurements_stg AS m
    LEFT JOIN sources AS s
      ON s.source_slug = m.source_slug
    WHERE s.source_id IS NULL
  ) THEN
    RAISE EXCEPTION 'batch10 measurements references unknown source_slug';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM phase2_batch10_thresholds_stg AS t
    LEFT JOIN sources AS s
      ON s.source_slug = t.source_slug
    WHERE s.source_id IS NULL
  ) THEN
    RAISE EXCEPTION 'batch10 thresholds references unknown source_slug';
  END IF;
END $$;

WITH resolved_measurements AS (
  SELECT
    m.priority_rank,
    p.resolved_food_id AS food_id,
    fst.fodmap_subtype_id,
    s.source_id,
    m.citation_ref,
    CASE
      WHEN m.comparator = 'lt' THEN '< ' || to_char(m.amount_per_100g, 'FM999999990.000000')
      WHEN m.comparator = 'lte' THEN '<= ' || to_char(m.amount_per_100g, 'FM999999990.000000')
      ELSE to_char(m.amount_per_100g, 'FM999999990.000000')
    END AS amount_raw,
    m.comparator,
    m.amount_per_100g,
    m.amount_per_serving,
    m.serving_g,
    m.method,
    m.evidence_tier,
    m.confidence_score,
    m.observed_at,
    m.notes
  FROM phase2_batch10_measurements_stg AS m
  JOIN phase2_priority_foods AS p
    ON p.priority_rank = m.priority_rank
  JOIN fodmap_subtypes AS fst
    ON fst.code = m.fodmap_subtype
  JOIN sources AS s
    ON s.source_slug = m.source_slug
),
inserted_measurements AS (
  INSERT INTO food_fodmap_measurements (
    food_id,
    fodmap_subtype_id,
    source_id,
    source_record_ref,
    amount_raw,
    comparator,
    amount_g_per_100g,
    amount_g_per_serving,
    serving_g,
    method,
    evidence_tier,
    confidence_score,
    observed_at,
    is_current,
    notes
  )
  SELECT
    rm.food_id,
    rm.fodmap_subtype_id,
    rm.source_id,
    rm.citation_ref,
    rm.amount_raw,
    rm.comparator,
    rm.amount_per_100g,
    rm.amount_per_serving,
    rm.serving_g,
    rm.method,
    rm.evidence_tier,
    rm.confidence_score,
    rm.observed_at,
    TRUE,
    rm.notes
  FROM resolved_measurements AS rm
  WHERE NOT EXISTS (
    SELECT 1
    FROM food_fodmap_measurements AS ffm
    WHERE ffm.food_id = rm.food_id
      AND ffm.fodmap_subtype_id = rm.fodmap_subtype_id
      AND ffm.source_id = rm.source_id
      AND COALESCE(ffm.source_record_ref, '') = COALESCE(rm.citation_ref, '')
      AND ffm.amount_raw = rm.amount_raw
      AND ffm.comparator = rm.comparator
      AND ffm.observed_at IS NOT DISTINCT FROM rm.observed_at
  )
  RETURNING measurement_id
)
SELECT COUNT(*) AS measurements_inserted
FROM inserted_measurements;

WITH resolved_thresholds AS (
  SELECT
    t.priority_rank,
    p.resolved_food_id AS food_id,
    fst.fodmap_subtype_id,
    s.source_id,
    t.serving_g,
    t.low_max_g,
    t.moderate_max_g,
    t.evidence_tier,
    t.confidence_score,
    t.valid_from,
    t.notes
  FROM phase2_batch10_thresholds_stg AS t
  JOIN phase2_priority_foods AS p
    ON p.priority_rank = t.priority_rank
  JOIN fodmap_subtypes AS fst
    ON fst.code = t.fodmap_subtype
  JOIN sources AS s
    ON s.source_slug = t.source_slug
),
upserted_thresholds AS (
  INSERT INTO food_fodmap_thresholds (
    food_id,
    fodmap_subtype_id,
    source_id,
    serving_g,
    low_max_g,
    moderate_max_g,
    threshold_basis,
    evidence_tier,
    confidence_score,
    valid_from,
    notes
  )
  SELECT
    rt.food_id,
    rt.fodmap_subtype_id,
    rt.source_id,
    rt.serving_g,
    rt.low_max_g,
    rt.moderate_max_g,
    'per_serving',
    rt.evidence_tier,
    rt.confidence_score,
    rt.valid_from,
    rt.notes
  FROM resolved_thresholds AS rt
  ON CONFLICT (food_id, fodmap_subtype_id, source_id, serving_g, valid_from)
  DO UPDATE
    SET low_max_g = EXCLUDED.low_max_g,
        moderate_max_g = EXCLUDED.moderate_max_g,
        evidence_tier = EXCLUDED.evidence_tier,
        confidence_score = EXCLUDED.confidence_score,
        notes = EXCLUDED.notes
  RETURNING (xmax = 0) AS inserted
)
SELECT
  COUNT(*) FILTER (WHERE inserted) AS thresholds_inserted,
  COUNT(*) FILTER (WHERE NOT inserted) AS thresholds_updated
FROM upserted_thresholds;

COMMIT;
