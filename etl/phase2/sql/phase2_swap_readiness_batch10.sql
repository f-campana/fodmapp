\set ON_ERROR_STOP on

-- Phase 2.3 batch10 swap-readiness matrix.
-- Read-only diagnostic output for the 10 resolved cohort rows.

WITH locked_ranks AS (
  SELECT unnest(ARRAY[1,2,4,5,14,15,34,39,40,41]) AS priority_rank
),
phase2_source_ids AS (
  SELECT source_id, source_slug
  FROM sources
  WHERE source_slug IN (
    'muir_2007_fructan',
    'biesiekierski_2011_fructan',
    'dysseler_hoffem_gos',
    'yao_2005_polyols',
    'monash_app_v4_reference'
  )
),
threshold_source AS (
  SELECT source_id, source_slug
  FROM sources
  WHERE source_slug = 'monash_app_v4_reference'
),
cohort AS (
  SELECT
    p.priority_rank,
    p.gap_bucket,
    p.target_subtype,
    p.food_label,
    p.variant_label,
    p.serving_g_provisional,
    p.resolved_food_id,
    f.canonical_name_fr
  FROM phase2_priority_foods AS p
  JOIN foods AS f
    ON f.food_id = p.resolved_food_id
  JOIN locked_ranks AS l
    ON l.priority_rank = p.priority_rank
),
measurement_ranked AS (
  SELECT
    c.priority_rank,
    ffm.amount_g_per_100g,
    ffm.amount_g_per_serving,
    ffm.serving_g,
    ffm.comparator,
    ffm.source_record_ref,
    ffm.observed_at,
    ps.source_slug AS measurement_source_slug,
    ROW_NUMBER() OVER (
      PARTITION BY c.priority_rank
      ORDER BY ffm.observed_at DESC NULLS LAST, ffm.created_at DESC, ffm.measurement_id DESC
    ) AS rn
  FROM cohort AS c
  JOIN fodmap_subtypes AS fst
    ON fst.code = c.target_subtype
  JOIN food_fodmap_measurements AS ffm
    ON ffm.food_id = c.resolved_food_id
   AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
  JOIN phase2_source_ids AS ps
    ON ps.source_id = ffm.source_id
),
latest_measurements AS (
  SELECT
    priority_rank,
    amount_g_per_100g,
    amount_g_per_serving,
    serving_g,
    comparator,
    source_record_ref,
    observed_at,
    measurement_source_slug
  FROM measurement_ranked
  WHERE rn = 1
),
threshold_ranked AS (
  SELECT
    c.priority_rank,
    fft.serving_g,
    fft.low_max_g,
    fft.moderate_max_g,
    fft.valid_from,
    fft.valid_to,
    ts.source_slug AS threshold_source_slug,
    ROW_NUMBER() OVER (
      PARTITION BY c.priority_rank
      ORDER BY fft.valid_from DESC, fft.threshold_id DESC
    ) AS rn
  FROM cohort AS c
  JOIN fodmap_subtypes AS fst
    ON fst.code = c.target_subtype
  JOIN food_fodmap_thresholds AS fft
    ON fft.food_id = c.resolved_food_id
   AND fft.fodmap_subtype_id = fst.fodmap_subtype_id
  JOIN threshold_source AS ts
    ON ts.source_id = fft.source_id
),
latest_thresholds AS (
  SELECT
    priority_rank,
    serving_g,
    low_max_g,
    moderate_max_g,
    valid_from,
    valid_to,
    threshold_source_slug
  FROM threshold_ranked
  WHERE rn = 1
)
SELECT
  c.priority_rank,
  c.gap_bucket,
  c.target_subtype,
  c.food_label,
  c.variant_label,
  c.resolved_food_id AS food_id,
  c.canonical_name_fr,
  c.serving_g_provisional,
  lm.serving_g AS measured_serving_g,
  lm.amount_g_per_100g,
  lm.amount_g_per_serving,
  lm.comparator,
  lm.measurement_source_slug,
  lm.source_record_ref AS measurement_citation_ref,
  lm.observed_at AS measurement_observed_at,
  lt.serving_g AS threshold_serving_g,
  lt.low_max_g,
  lt.moderate_max_g,
  lt.threshold_source_slug,
  lt.valid_from AS threshold_valid_from,
  CASE
    WHEN lm.amount_g_per_serving IS NULL OR lt.low_max_g IS NULL OR lt.moderate_max_g IS NULL THEN 'unknown'
    WHEN lm.amount_g_per_serving <= lt.low_max_g THEN 'low'
    WHEN lm.amount_g_per_serving <= lt.moderate_max_g THEN 'moderate'
    ELSE 'high'
  END AS inferred_serving_band
FROM cohort AS c
LEFT JOIN latest_measurements AS lm
  ON lm.priority_rank = c.priority_rank
LEFT JOIN latest_thresholds AS lt
  ON lt.priority_rank = c.priority_rank
ORDER BY c.priority_rank;
