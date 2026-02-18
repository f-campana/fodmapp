\set ON_ERROR_STOP on

-- Phase 2 batch01 replay checks (expected state immediately after pass1 + batch01 apply).

SELECT
  p.priority_rank,
  p.food_label,
  p.variant_label,
  p.status,
  p.resolution_method,
  p.resolved_food_id,
  p.resolved_by,
  p.resolved_at
FROM phase2_priority_foods AS p
WHERE p.priority_rank IN (1,2,4,5,14,15,34,39,40,41)
ORDER BY p.priority_rank;

WITH unresolved AS (
  SELECT p.priority_rank
  FROM phase2_priority_foods AS p
  WHERE p.resolved_food_id IS NULL
)
SELECT
  COUNT(*) AS unresolved_total,
  COUNT(*) FILTER (
    WHERE EXISTS (
      SELECT 1
      FROM v_phase2_resolution_candidates AS c
      WHERE c.priority_rank = unresolved.priority_rank
    )
  ) AS unresolved_with_candidates,
  COUNT(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1
      FROM v_phase2_resolution_candidates AS c
      WHERE c.priority_rank = unresolved.priority_rank
    )
  ) AS unresolved_without_candidates
FROM unresolved;

DO $$
DECLARE
  v_total_rows INTEGER;
  v_resolved_rows INTEGER;
  v_unresolved_rows INTEGER;
  v_rank1_resolved_id UUID;
  v_rank1_resolution_method TEXT;
  v_rank1_resolved_by TEXT;
  v_batch01_resolved_count INTEGER;
  v_with_candidates INTEGER;
  v_without_candidates INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_rows
  FROM phase2_priority_foods;

  IF v_total_rows <> 42 THEN
    RAISE EXCEPTION 'total row check failed: expected 42, got %', v_total_rows;
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL),
    COUNT(*) FILTER (WHERE resolved_food_id IS NULL)
  INTO v_resolved_rows, v_unresolved_rows
  FROM phase2_priority_foods;

  IF v_resolved_rows <> 10 THEN
    RAISE EXCEPTION 'resolved row check failed: expected 10, got %', v_resolved_rows;
  END IF;

  IF v_unresolved_rows <> 32 THEN
    RAISE EXCEPTION 'unresolved row check failed: expected 32, got %', v_unresolved_rows;
  END IF;

  SELECT resolved_food_id, resolution_method, resolved_by
  INTO v_rank1_resolved_id, v_rank1_resolution_method, v_rank1_resolved_by
  FROM phase2_priority_foods
  WHERE priority_rank = 1;

  IF v_rank1_resolved_id IS NULL THEN
    RAISE EXCEPTION 'rank1 check failed: expected pass1 to resolve priority_rank=1';
  END IF;

  IF v_rank1_resolution_method <> 'ciqual_code' THEN
    RAISE EXCEPTION 'rank1 check failed: expected resolution_method=ciqual_code, got %', v_rank1_resolution_method;
  END IF;

  IF v_rank1_resolved_by <> 'etl_pass1' THEN
    RAISE EXCEPTION 'rank1 check failed: expected resolved_by=etl_pass1, got %', v_rank1_resolved_by;
  END IF;

  SELECT COUNT(*) INTO v_batch01_resolved_count
  FROM phase2_priority_foods
  WHERE priority_rank IN (2,4,5,14,15,34,39,40,41)
    AND resolved_food_id IS NOT NULL
    AND status = 'resolved';

  IF v_batch01_resolved_count <> 9 THEN
    RAISE EXCEPTION 'batch01 rank check failed: expected 9 resolved rows in batch01 set, got %', v_batch01_resolved_count;
  END IF;

  WITH unresolved AS (
    SELECT p.priority_rank
    FROM phase2_priority_foods AS p
    WHERE p.resolved_food_id IS NULL
  )
  SELECT
    COUNT(*) FILTER (
      WHERE EXISTS (
        SELECT 1
        FROM v_phase2_resolution_candidates AS c
        WHERE c.priority_rank = unresolved.priority_rank
      )
    ),
    COUNT(*) FILTER (
      WHERE NOT EXISTS (
        SELECT 1
        FROM v_phase2_resolution_candidates AS c
        WHERE c.priority_rank = unresolved.priority_rank
      )
    )
  INTO v_with_candidates, v_without_candidates
  FROM unresolved;

  IF v_with_candidates <> 21 THEN
    RAISE EXCEPTION 'candidate pool check failed: expected 21 unresolved-with-candidates, got %', v_with_candidates;
  END IF;

  IF v_without_candidates <> 11 THEN
    RAISE EXCEPTION 'candidate pool check failed: expected 11 unresolved-without-candidates, got %', v_without_candidates;
  END IF;
END $$;
