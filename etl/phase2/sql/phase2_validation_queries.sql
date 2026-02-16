-- Phase 2 scaffold validation queries.
-- Run after loading /Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_scaffold_views.sql

-- 1) Priority rows still unresolved to a food_id
SELECT
  priority_rank,
  gap_bucket,
  target_subtype,
  food_label,
  variant_label,
  ciqual_code_hint,
  food_slug_hint,
  resolution_method
FROM v_phase2_priority_food_candidates
WHERE resolved_food_id IS NULL
ORDER BY priority_rank;

-- 2) Expected Phase 2 source slugs missing from sources
WITH expected_source_slugs(source_slug) AS (
  VALUES
    ('muir_2007_fructan'),
    ('biesiekierski_2011_fructan'),
    ('dysseler_hoffem_gos'),
    ('yao_2005_polyols'),
    ('monash_app_v4_reference')
)
SELECT
  e.source_slug,
  s.source_id
FROM expected_source_slugs AS e
LEFT JOIN sources AS s
  ON s.source_slug = e.source_slug
WHERE s.source_id IS NULL
ORDER BY e.source_slug;

-- 3) Completion status by gap bucket and target subtype
SELECT
  gap_bucket,
  target_subtype,
  priority_rows,
  resolved_rows,
  completed_rows,
  unresolved_rows,
  pending_measurement_rows,
  completion_ratio,
  latest_observed_at
FROM v_phase2_gap_completion
ORDER BY
  CASE gap_bucket
    WHEN 'fructan_dominant' THEN 1
    WHEN 'gos_dominant' THEN 2
    WHEN 'polyol_split_needed' THEN 3
    ELSE 9
  END,
  target_subtype;

-- 4) Readiness for first swap-engine cohort (top 12 priority rows)
WITH phase2_sources AS (
  SELECT source_id
  FROM sources
  WHERE source_slug IN (
    'muir_2007_fructan',
    'biesiekierski_2011_fructan',
    'dysseler_hoffem_gos',
    'yao_2005_polyols',
    'monash_app_v4_reference'
  )
),
first_cohort AS (
  SELECT *
  FROM v_phase2_priority_food_candidates
  WHERE priority_rank <= 12
),
cohort_measurements AS (
  SELECT
    c.priority_rank,
    c.gap_bucket,
    c.target_subtype,
    c.food_label,
    c.variant_label,
    c.resolved_food_id,
    EXISTS (
      SELECT 1
      FROM fodmap_subtypes AS fst
      JOIN food_fodmap_measurements AS ffm
        ON ffm.fodmap_subtype_id = fst.fodmap_subtype_id
      WHERE fst.code = c.target_subtype
        AND ffm.food_id = c.resolved_food_id
        AND ffm.source_id IN (SELECT source_id FROM phase2_sources)
    ) AS has_phase2_measurement
  FROM first_cohort AS c
)
SELECT
  COUNT(*) AS cohort_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL) AS resolved_rows,
  COUNT(*) FILTER (WHERE has_phase2_measurement) AS measured_rows,
  ROUND(
    COUNT(*) FILTER (WHERE has_phase2_measurement)::numeric / NULLIF(COUNT(*), 0),
    3
  ) AS readiness_ratio
FROM cohort_measurements;

-- 5) Detailed blockers in first swap-engine cohort
WITH phase2_sources AS (
  SELECT source_id
  FROM sources
  WHERE source_slug IN (
    'muir_2007_fructan',
    'biesiekierski_2011_fructan',
    'dysseler_hoffem_gos',
    'yao_2005_polyols',
    'monash_app_v4_reference'
  )
),
first_cohort AS (
  SELECT *
  FROM v_phase2_priority_food_candidates
  WHERE priority_rank <= 12
),
cohort_measurements AS (
  SELECT
    c.priority_rank,
    c.gap_bucket,
    c.target_subtype,
    c.food_label,
    c.variant_label,
    c.resolved_food_id,
    c.resolution_method,
    EXISTS (
      SELECT 1
      FROM fodmap_subtypes AS fst
      JOIN food_fodmap_measurements AS ffm
        ON ffm.fodmap_subtype_id = fst.fodmap_subtype_id
      WHERE fst.code = c.target_subtype
        AND ffm.food_id = c.resolved_food_id
        AND ffm.source_id IN (SELECT source_id FROM phase2_sources)
    ) AS has_phase2_measurement
  FROM first_cohort AS c
)
SELECT
  priority_rank,
  gap_bucket,
  target_subtype,
  food_label,
  variant_label,
  resolved_food_id,
  resolution_method,
  has_phase2_measurement
FROM cohort_measurements
WHERE resolved_food_id IS NULL OR NOT has_phase2_measurement
ORDER BY priority_rank;
