\set ON_ERROR_STOP on

-- Phase 2.3/2.4 batch10 status sync.
-- Contract:
-- - threshold_set requires BOTH a current measurement and a threshold for target subtype
-- - measured requires a current measurement and no threshold
-- - otherwise resolved (for resolved cohort rows)

WITH locked_ranks AS (
  SELECT unnest(ARRAY[1,2,4,5,14,15,34,39,40,41]) AS priority_rank
),
phase2_source_ids AS (
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
threshold_source AS (
  SELECT source_id
  FROM sources
  WHERE source_slug = 'monash_app_v4_reference'
),
status_eval AS (
  SELECT
    p.priority_rank,
    p.status AS current_status,
    EXISTS (
      SELECT 1
      FROM fodmap_subtypes AS fst
      JOIN food_fodmap_measurements AS ffm
        ON ffm.fodmap_subtype_id = fst.fodmap_subtype_id
      WHERE fst.code = p.target_subtype
        AND ffm.food_id = p.resolved_food_id
        AND ffm.source_id IN (SELECT source_id FROM phase2_source_ids)
        AND ffm.is_current = TRUE
    ) AS has_current_measurement,
    EXISTS (
      SELECT 1
      FROM fodmap_subtypes AS fst
      JOIN food_fodmap_thresholds AS fft
        ON fft.fodmap_subtype_id = fst.fodmap_subtype_id
      WHERE fst.code = p.target_subtype
        AND fft.food_id = p.resolved_food_id
        AND fft.source_id IN (SELECT source_id FROM threshold_source)
    ) AS has_threshold
  FROM phase2_priority_foods AS p
  JOIN locked_ranks AS l
    ON l.priority_rank = p.priority_rank
  WHERE p.resolved_food_id IS NOT NULL
),
next_state AS (
  SELECT
    s.priority_rank,
    s.current_status,
    CASE
      WHEN s.has_current_measurement AND s.has_threshold THEN 'threshold_set'
      WHEN s.has_current_measurement THEN 'measured'
      ELSE 'resolved'
    END AS next_status
  FROM status_eval AS s
),
updated AS (
  UPDATE phase2_priority_foods AS p
  SET
    status = n.next_status,
    updated_at = now()
  FROM next_state AS n
  WHERE p.priority_rank = n.priority_rank
    AND p.status IS DISTINCT FROM n.next_status
  RETURNING p.priority_rank, n.current_status, n.next_status
)
SELECT
  COUNT(*) AS rows_updated
FROM updated;

SELECT
  priority_rank,
  food_label,
  variant_label,
  status,
  resolution_method,
  resolved_food_id
FROM phase2_priority_foods
WHERE priority_rank IN (1,2,4,5,14,15,34,39,40,41)
ORDER BY priority_rank;
