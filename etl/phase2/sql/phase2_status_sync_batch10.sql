\set ON_ERROR_STOP on

-- Phase 2.3 batch10 status sync.
-- Updates only locked cohort rows and only when status change is required.

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
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM fodmap_subtypes AS fst
        JOIN food_fodmap_thresholds AS fft
          ON fft.fodmap_subtype_id = fst.fodmap_subtype_id
        WHERE fst.code = p.target_subtype
          AND fft.food_id = p.resolved_food_id
          AND fft.source_id IN (SELECT source_id FROM threshold_source)
      ) THEN 'threshold_set'
      WHEN EXISTS (
        SELECT 1
        FROM fodmap_subtypes AS fst
        JOIN food_fodmap_measurements AS ffm
          ON ffm.fodmap_subtype_id = fst.fodmap_subtype_id
        WHERE fst.code = p.target_subtype
          AND ffm.food_id = p.resolved_food_id
          AND ffm.source_id IN (SELECT source_id FROM phase2_source_ids)
      ) THEN 'measured'
      ELSE p.status
    END AS next_status
  FROM phase2_priority_foods AS p
  JOIN locked_ranks AS l
    ON l.priority_rank = p.priority_rank
  WHERE p.resolved_food_id IS NOT NULL
),
updated AS (
  UPDATE phase2_priority_foods AS p
  SET
    status = s.next_status,
    updated_at = now()
  FROM status_eval AS s
  WHERE p.priority_rank = s.priority_rank
    AND p.status IS DISTINCT FROM s.next_status
  RETURNING p.priority_rank, s.current_status, s.next_status
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
