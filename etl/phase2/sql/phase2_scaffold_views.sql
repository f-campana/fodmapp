-- Phase 2 scaffold analytics for CIQUAL-gap-driven research planning.
-- Non-mutating: creates analytical views only.

DROP VIEW IF EXISTS v_phase2_gap_completion;
DROP VIEW IF EXISTS v_phase2_priority_food_candidates;

CREATE OR REPLACE VIEW v_phase2_priority_food_candidates AS
SELECT
  p.priority_rank,
  p.gap_bucket,
  p.target_subtype,
  p.food_label,
  p.variant_label,
  p.ciqual_code_hint,
  p.food_slug_hint,
  p.serving_g_provisional,
  p.source_strategy,
  p.status,
  p.resolved_food_id,
  p.resolution_method,
  p.resolution_notes,
  p.resolved_at,
  p.resolved_by,
  p.created_at,
  p.updated_at
FROM phase2_priority_foods AS p
ORDER BY p.priority_rank;

CREATE OR REPLACE VIEW v_phase2_gap_completion AS
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
row_status AS (
  SELECT
    c.priority_rank,
    c.gap_bucket,
    c.target_subtype,
    c.food_label,
    c.variant_label,
    c.resolved_food_id,
    COUNT(ffm.measurement_id) AS phase2_measurement_count,
    MAX(ffm.observed_at) AS latest_observed_at
  FROM v_phase2_priority_food_candidates AS c
  LEFT JOIN fodmap_subtypes AS fst
    ON fst.code = c.target_subtype
  LEFT JOIN food_fodmap_measurements AS ffm
    ON ffm.food_id = c.resolved_food_id
    AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
    AND ffm.source_id IN (SELECT source_id FROM phase2_sources)
    AND ffm.is_current = TRUE
  GROUP BY
    c.priority_rank,
    c.gap_bucket,
    c.target_subtype,
    c.food_label,
    c.variant_label,
    c.resolved_food_id
)
SELECT
  gap_bucket,
  target_subtype,
  COUNT(*) AS priority_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL) AS resolved_rows,
  COUNT(*) FILTER (WHERE phase2_measurement_count > 0) AS completed_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NULL) AS unresolved_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL AND phase2_measurement_count = 0) AS pending_measurement_rows,
  ROUND(
    COUNT(*) FILTER (WHERE phase2_measurement_count > 0)::numeric
    / NULLIF(COUNT(*), 0),
    3
  ) AS completion_ratio,
  MAX(latest_observed_at) AS latest_observed_at
FROM row_status
GROUP BY gap_bucket, target_subtype
ORDER BY
  CASE gap_bucket
    WHEN 'fructan_dominant' THEN 1
    WHEN 'gos_dominant' THEN 2
    WHEN 'polyol_split_needed' THEN 3
    ELSE 9
  END,
  target_subtype;
