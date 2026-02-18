\set ON_ERROR_STOP on

-- Phase 2 replay final deterministic invariants.

SELECT
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL) AS resolved_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NULL) AS unresolved_rows
FROM phase2_priority_foods;

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
    ELSE 9
  END,
  target_subtype;

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
  v_fr_priority INTEGER;
  v_fr_resolved INTEGER;
  v_fr_completed INTEGER;
  v_fr_unresolved INTEGER;
  v_fr_pending INTEGER;
  v_gos_priority INTEGER;
  v_gos_resolved INTEGER;
  v_gos_completed INTEGER;
  v_gos_unresolved INTEGER;
  v_gos_pending INTEGER;
  v_sor_priority INTEGER;
  v_sor_resolved INTEGER;
  v_sor_completed INTEGER;
  v_sor_unresolved INTEGER;
  v_sor_pending INTEGER;
  v_man_priority INTEGER;
  v_man_resolved INTEGER;
  v_man_completed INTEGER;
  v_man_unresolved INTEGER;
  v_man_pending INTEGER;
  v_with_candidates INTEGER;
  v_without_candidates INTEGER;
  v_rank2_current_measurements INTEGER;
  v_duplicate_measurements INTEGER;
  v_duplicate_custom_refs INTEGER;
  v_custom_ref_count INTEGER;
  v_custom_ref_distinct_count INTEGER;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL),
    COUNT(*) FILTER (WHERE resolved_food_id IS NULL)
  INTO v_total_rows, v_resolved_rows, v_unresolved_rows
  FROM phase2_priority_foods;

  IF v_total_rows <> 42 THEN
    RAISE EXCEPTION 'priority total check failed: expected 42, got %', v_total_rows;
  END IF;

  IF v_resolved_rows <> 42 THEN
    RAISE EXCEPTION 'priority resolved check failed: expected 42, got %', v_resolved_rows;
  END IF;

  IF v_unresolved_rows <> 0 THEN
    RAISE EXCEPTION 'priority unresolved check failed: expected 0, got %', v_unresolved_rows;
  END IF;

  SELECT
    priority_rows,
    resolved_rows,
    completed_rows,
    unresolved_rows,
    pending_measurement_rows
  INTO
    v_fr_priority,
    v_fr_resolved,
    v_fr_completed,
    v_fr_unresolved,
    v_fr_pending
  FROM v_phase2_gap_completion
  WHERE gap_bucket = 'fructan_dominant'
    AND target_subtype = 'fructan';

  IF (COALESCE(v_fr_priority, -1), COALESCE(v_fr_resolved, -1), COALESCE(v_fr_completed, -1), COALESCE(v_fr_unresolved, -1), COALESCE(v_fr_pending, -1))
     <> (17, 17, 16, 0, 1) THEN
    RAISE EXCEPTION 'fructan completion check failed: expected (17,17,16,0,1), got (%,%,%,%,%)',
      COALESCE(v_fr_priority, -1), COALESCE(v_fr_resolved, -1), COALESCE(v_fr_completed, -1), COALESCE(v_fr_unresolved, -1), COALESCE(v_fr_pending, -1);
  END IF;

  SELECT
    priority_rows,
    resolved_rows,
    completed_rows,
    unresolved_rows,
    pending_measurement_rows
  INTO
    v_gos_priority,
    v_gos_resolved,
    v_gos_completed,
    v_gos_unresolved,
    v_gos_pending
  FROM v_phase2_gap_completion
  WHERE gap_bucket = 'gos_dominant'
    AND target_subtype = 'gos';

  IF (COALESCE(v_gos_priority, -1), COALESCE(v_gos_resolved, -1), COALESCE(v_gos_completed, -1), COALESCE(v_gos_unresolved, -1), COALESCE(v_gos_pending, -1))
     <> (12, 12, 12, 0, 0) THEN
    RAISE EXCEPTION 'gos completion check failed: expected (12,12,12,0,0), got (%,%,%,%,%)',
      COALESCE(v_gos_priority, -1), COALESCE(v_gos_resolved, -1), COALESCE(v_gos_completed, -1), COALESCE(v_gos_unresolved, -1), COALESCE(v_gos_pending, -1);
  END IF;

  SELECT
    priority_rows,
    resolved_rows,
    completed_rows,
    unresolved_rows,
    pending_measurement_rows
  INTO
    v_sor_priority,
    v_sor_resolved,
    v_sor_completed,
    v_sor_unresolved,
    v_sor_pending
  FROM v_phase2_gap_completion
  WHERE gap_bucket = 'polyol_split_needed'
    AND target_subtype = 'sorbitol';

  IF (COALESCE(v_sor_priority, -1), COALESCE(v_sor_resolved, -1), COALESCE(v_sor_completed, -1), COALESCE(v_sor_unresolved, -1), COALESCE(v_sor_pending, -1))
     <> (7, 7, 7, 0, 0) THEN
    RAISE EXCEPTION 'sorbitol completion check failed: expected (7,7,7,0,0), got (%,%,%,%,%)',
      COALESCE(v_sor_priority, -1), COALESCE(v_sor_resolved, -1), COALESCE(v_sor_completed, -1), COALESCE(v_sor_unresolved, -1), COALESCE(v_sor_pending, -1);
  END IF;

  SELECT
    priority_rows,
    resolved_rows,
    completed_rows,
    unresolved_rows,
    pending_measurement_rows
  INTO
    v_man_priority,
    v_man_resolved,
    v_man_completed,
    v_man_unresolved,
    v_man_pending
  FROM v_phase2_gap_completion
  WHERE gap_bucket = 'polyol_split_needed'
    AND target_subtype = 'mannitol';

  IF (COALESCE(v_man_priority, -1), COALESCE(v_man_resolved, -1), COALESCE(v_man_completed, -1), COALESCE(v_man_unresolved, -1), COALESCE(v_man_pending, -1))
     <> (6, 6, 6, 0, 0) THEN
    RAISE EXCEPTION 'mannitol completion check failed: expected (6,6,6,0,0), got (%,%,%,%,%)',
      COALESCE(v_man_priority, -1), COALESCE(v_man_resolved, -1), COALESCE(v_man_completed, -1), COALESCE(v_man_unresolved, -1), COALESCE(v_man_pending, -1);
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

  IF v_with_candidates <> 0 THEN
    RAISE EXCEPTION 'candidate pool check failed: expected 0 unresolved-with-candidates, got %', v_with_candidates;
  END IF;

  IF v_without_candidates <> 0 THEN
    RAISE EXCEPTION 'candidate pool check failed: expected 0 unresolved-without-candidates, got %', v_without_candidates;
  END IF;

  SELECT COUNT(*) INTO v_rank2_current_measurements
  FROM phase2_priority_foods AS p
  JOIN fodmap_subtypes AS fst
    ON fst.code = p.target_subtype
  JOIN food_fodmap_measurements AS ffm
    ON ffm.food_id = p.resolved_food_id
   AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
   AND ffm.is_current = TRUE
  WHERE p.priority_rank = 2;

  IF v_rank2_current_measurements <> 0 THEN
    RAISE EXCEPTION 'rank2 quarantine check failed: expected 0 current measurements, got %', v_rank2_current_measurements;
  END IF;

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
  SELECT COUNT(*) INTO v_duplicate_measurements
  FROM (
    SELECT
      ffm.food_id,
      ffm.fodmap_subtype_id,
      ffm.source_id,
      ffm.source_record_ref,
      ffm.amount_raw,
      ffm.comparator,
      ffm.observed_at,
      COUNT(*) AS c
    FROM food_fodmap_measurements AS ffm
    WHERE ffm.source_id IN (SELECT source_id FROM phase2_sources)
    GROUP BY
      ffm.food_id,
      ffm.fodmap_subtype_id,
      ffm.source_id,
      ffm.source_record_ref,
      ffm.amount_raw,
      ffm.comparator,
      ffm.observed_at
    HAVING COUNT(*) > 1
  ) AS dup;

  IF v_duplicate_measurements <> 0 THEN
    RAISE EXCEPTION 'duplicate phase2 measurement signatures detected: %', v_duplicate_measurements;
  END IF;

  SELECT COUNT(*) INTO v_duplicate_custom_refs
  FROM (
    SELECT fer.ref_value
    FROM food_external_refs AS fer
    WHERE fer.ref_system = 'CUSTOM'
      AND fer.ref_value LIKE 'phase2_pass3:%'
    GROUP BY fer.ref_value
    HAVING COUNT(*) > 1
  ) AS dup;

  IF v_duplicate_custom_refs <> 0 THEN
    RAISE EXCEPTION 'duplicate CUSTOM phase2_pass3 refs detected: %', v_duplicate_custom_refs;
  END IF;

  SELECT
    COUNT(*),
    COUNT(DISTINCT fer.ref_value)
  INTO v_custom_ref_count, v_custom_ref_distinct_count
  FROM food_external_refs AS fer
  WHERE fer.ref_system = 'CUSTOM'
    AND fer.ref_value LIKE 'phase2_pass3:%';

  IF v_custom_ref_count <> 19 THEN
    RAISE EXCEPTION 'pass3 custom ref count check failed: expected 19, got %', v_custom_ref_count;
  END IF;

  IF v_custom_ref_distinct_count <> 19 THEN
    RAISE EXCEPTION 'pass3 distinct custom ref count check failed: expected 19, got %', v_custom_ref_distinct_count;
  END IF;
END $$;
