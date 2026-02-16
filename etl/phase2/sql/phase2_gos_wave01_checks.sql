\set ON_ERROR_STOP on

-- Proposal-only wave checks for gos_wave01.
-- Scope lock: priority_rank IN (18,19,20,21,22,23)

SELECT
  p.priority_rank,
  p.food_label,
  p.variant_label,
  p.target_subtype,
  p.status,
  p.resolution_method,
  p.resolved_food_id
FROM phase2_priority_foods AS p
WHERE p.priority_rank IN (18,19,20,21,22,23)
ORDER BY p.priority_rank;

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
)
SELECT
  p.priority_rank,
  p.target_subtype,
  COUNT(ffm.measurement_id) FILTER (WHERE ffm.is_current = TRUE) AS current_measurements,
  COUNT(fft.threshold_id) AS thresholds
FROM phase2_priority_foods AS p
JOIN fodmap_subtypes AS fst
  ON fst.code = p.target_subtype
LEFT JOIN food_fodmap_measurements AS ffm
  ON ffm.food_id = p.resolved_food_id
 AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
 AND ffm.source_id IN (SELECT source_id FROM phase2_sources)
LEFT JOIN food_fodmap_thresholds AS fft
  ON fft.food_id = p.resolved_food_id
 AND fft.fodmap_subtype_id = fst.fodmap_subtype_id
WHERE p.priority_rank IN (18,19,20,21,22,23)
GROUP BY p.priority_rank, p.target_subtype
ORDER BY p.priority_rank;

SELECT
  'gos_wave01' AS wave_key,
  COUNT(*) AS wave_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL) AS resolved_rows,
  COUNT(*) FILTER (WHERE status = 'threshold_set') AS threshold_set_rows
FROM phase2_priority_foods
WHERE priority_rank IN (18,19,20,21,22,23);
