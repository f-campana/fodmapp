-- Phase 2 batch01 post-apply checks.
-- Run after applying:
--   /Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_resolutions_batch01.sql
--
-- Expected baseline contract for batch01:
-- - total rows remain 42
-- - approved resolve set = 9 rows (priority_rank in 2,4,5,14,15,34,39,40,41)
-- - unresolved no-candidate carryover pool remains 11 (deferred to Pass 3)

SELECT
  COUNT(*) AS total_rows,
  CASE WHEN COUNT(*) = 42 THEN 'PASS' ELSE 'FAIL' END AS total_rows_check
FROM phase2_priority_foods;

SELECT
  COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL) AS resolved_count,
  COUNT(*) FILTER (WHERE resolved_food_id IS NULL) AS unresolved_count
FROM phase2_priority_foods;

SELECT
  COUNT(*) AS approved_rows_expected,
  COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL) AS approved_rows_resolved,
  COUNT(*) FILTER (WHERE resolved_food_id IS NULL) AS approved_rows_still_unresolved,
  CASE
    WHEN COUNT(*) FILTER (WHERE resolved_food_id IS NULL) = 0 THEN 'PASS'
    ELSE 'FAIL'
  END AS approved_rows_resolution_check
FROM phase2_priority_foods
WHERE priority_rank IN (2, 4, 5, 14, 15, 34, 39, 40, 41);

SELECT
  COUNT(*) AS unresolved_no_candidate_pool,
  CASE WHEN COUNT(*) = 11 THEN 'PASS' ELSE 'FAIL' END AS unresolved_no_candidate_check
FROM phase2_priority_foods AS p
WHERE p.resolved_food_id IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM v_phase2_resolution_candidates AS c
    WHERE c.priority_rank = p.priority_rank
  );

SELECT
  COUNT(*) AS rows_tagged_batch01
FROM phase2_priority_foods
WHERE resolution_notes LIKE 'Batch01 conservative manual approval%';

-- Re-run idempotency indicator:
-- If you execute phase2_resolutions_batch01.sql again, this should remain 0.
SELECT
  COUNT(*) AS idempotency_guard_rows
FROM phase2_priority_foods
WHERE priority_rank IN (2, 4, 5, 14, 15, 34, 39, 40, 41)
  AND resolved_food_id IS NULL;

SELECT
  p.priority_rank,
  p.gap_bucket,
  p.target_subtype,
  p.food_label,
  p.variant_label
FROM phase2_priority_foods AS p
WHERE p.resolved_food_id IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM v_phase2_resolution_candidates AS c
    WHERE c.priority_rank = p.priority_rank
  )
ORDER BY p.priority_rank;

SELECT
  gap_bucket,
  target_subtype,
  priority_rows,
  resolved_rows,
  completed_rows,
  unresolved_rows,
  pending_measurement_rows,
  completion_ratio
FROM v_phase2_gap_completion
ORDER BY
  CASE gap_bucket
    WHEN 'fructan_dominant' THEN 1
    WHEN 'gos_dominant' THEN 2
    WHEN 'polyol_split_needed' THEN 3
    ELSE 4
  END,
  target_subtype;
