-- Phase 2 resolver pass 1: deterministic CIQUAL-code resolution only.
-- Safe auto-update: unresolved rows + ciqual_code_hint match.

WITH ciqual_matches AS (
  SELECT
    p.priority_rank,
    m.food_id
  FROM phase2_priority_foods AS p
  JOIN LATERAL (
    SELECT fer.food_id
    FROM food_external_refs AS fer
    WHERE fer.ref_system = 'CIQUAL'
      AND p.ciqual_code_hint IS NOT NULL
      AND (
        fer.ref_value = p.ciqual_code_hint
        OR ltrim(fer.ref_value, '0') = ltrim(p.ciqual_code_hint, '0')
      )
    ORDER BY fer.food_id
    LIMIT 1
  ) AS m ON TRUE
  WHERE p.resolved_food_id IS NULL
),
updated AS (
  UPDATE phase2_priority_foods AS p
  SET
    resolved_food_id = m.food_id,
    resolution_method = 'ciqual_code',
    resolution_notes = 'Resolved by CIQUAL code hint in pass1',
    status = CASE
      WHEN p.status = 'pending_research' THEN 'resolved'
      ELSE p.status
    END,
    resolved_at = now(),
    resolved_by = 'etl_pass1',
    updated_at = now()
  FROM ciqual_matches AS m
  WHERE p.priority_rank = m.priority_rank
  RETURNING p.priority_rank, p.food_label, p.variant_label, p.resolved_food_id, p.resolution_method
)
SELECT *
FROM updated
ORDER BY priority_rank;

SELECT
  COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL) AS resolved_count,
  COUNT(*) FILTER (WHERE resolved_food_id IS NULL) AS unresolved_count
FROM phase2_priority_foods;
