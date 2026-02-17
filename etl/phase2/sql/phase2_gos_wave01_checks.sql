\set ON_ERROR_STOP on

-- Phase 2.6 GOS Wave 1 hard checks

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
WHERE p.priority_rank IN (18,19,20,21,22,23)
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
WHERE gap_bucket = 'gos_dominant'
  AND target_subtype = 'gos';

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
  v_resolved_links INTEGER;
  v_unresolved_rows INTEGER;
  v_wave_resolved INTEGER;
  v_wave_threshold_set INTEGER;
  v_wave_measurements INTEGER;
  v_wave_thresholds INTEGER;
  v_gos_resolved INTEGER;
  v_gos_completed INTEGER;
  v_gos_unresolved INTEGER;
  v_gos_pending INTEGER;
  v_with_candidates INTEGER;
  v_without_candidates INTEGER;
  v_duplicate_custom_refs INTEGER;
  v_duplicate_measurements INTEGER;
  v_rank2_current_measurements INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_rows
  FROM phase2_priority_foods;

  IF v_total_rows <> 42 THEN
    RAISE EXCEPTION 'total row check failed: expected 42, got %', v_total_rows;
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL),
    COUNT(*) FILTER (WHERE resolved_food_id IS NULL)
  INTO v_resolved_links, v_unresolved_rows
  FROM phase2_priority_foods;

  IF v_resolved_links <> 27 THEN
    RAISE EXCEPTION 'resolved links check failed: expected 27, got %', v_resolved_links;
  END IF;

  IF v_unresolved_rows <> 15 THEN
    RAISE EXCEPTION 'unresolved check failed: expected 15, got %', v_unresolved_rows;
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL),
    COUNT(*) FILTER (WHERE status = 'threshold_set')
  INTO v_wave_resolved, v_wave_threshold_set
  FROM phase2_priority_foods
  WHERE priority_rank IN (18,19,20,21,22,23);

  IF v_wave_resolved <> 6 THEN
    RAISE EXCEPTION 'wave resolution check failed: expected 6 resolved, got %', v_wave_resolved;
  END IF;

  IF v_wave_threshold_set <> 6 THEN
    RAISE EXCEPTION 'wave status check failed: expected 6 threshold_set, got %', v_wave_threshold_set;
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
  SELECT COUNT(*) INTO v_wave_measurements
  FROM phase2_priority_foods AS p
  JOIN fodmap_subtypes AS fst
    ON fst.code = p.target_subtype
  WHERE p.priority_rank IN (18,19,20,21,22,23)
    AND EXISTS (
      SELECT 1
      FROM food_fodmap_measurements AS ffm
      WHERE ffm.food_id = p.resolved_food_id
        AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
        AND ffm.source_id IN (SELECT source_id FROM phase2_sources)
        AND ffm.is_current = TRUE
    );

  IF v_wave_measurements <> 6 THEN
    RAISE EXCEPTION 'wave measurement coverage failed: expected 6, got %', v_wave_measurements;
  END IF;

  SELECT COUNT(*) INTO v_wave_thresholds
  FROM phase2_priority_foods AS p
  JOIN fodmap_subtypes AS fst
    ON fst.code = p.target_subtype
  JOIN sources AS s
    ON s.source_slug = 'monash_app_v4_reference'
  WHERE p.priority_rank IN (18,19,20,21,22,23)
    AND EXISTS (
      SELECT 1
      FROM food_fodmap_thresholds AS fft
      WHERE fft.food_id = p.resolved_food_id
        AND fft.fodmap_subtype_id = fst.fodmap_subtype_id
        AND fft.source_id = s.source_id
    );

  IF v_wave_thresholds <> 6 THEN
    RAISE EXCEPTION 'wave threshold coverage failed: expected 6, got %', v_wave_thresholds;
  END IF;

  SELECT
    resolved_rows,
    completed_rows,
    unresolved_rows,
    pending_measurement_rows
  INTO v_gos_resolved, v_gos_completed, v_gos_unresolved, v_gos_pending
  FROM v_phase2_gap_completion
  WHERE gap_bucket = 'gos_dominant'
    AND target_subtype = 'gos';

  IF COALESCE(v_gos_resolved, -1) <> 6 THEN
    RAISE EXCEPTION 'gos gap resolved check failed: expected 6, got %', COALESCE(v_gos_resolved, -1);
  END IF;

  IF COALESCE(v_gos_completed, -1) <> 6 THEN
    RAISE EXCEPTION 'gos gap completed check failed: expected 6, got %', COALESCE(v_gos_completed, -1);
  END IF;

  IF COALESCE(v_gos_unresolved, -1) <> 6 THEN
    RAISE EXCEPTION 'gos gap unresolved check failed: expected 6, got %', COALESCE(v_gos_unresolved, -1);
  END IF;

  IF COALESCE(v_gos_pending, -1) <> 0 THEN
    RAISE EXCEPTION 'gos gap pending check failed: expected 0, got %', COALESCE(v_gos_pending, -1);
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

  IF v_with_candidates <> 9 THEN
    RAISE EXCEPTION 'candidate pool check failed: expected 9 unresolved-with-candidates, got %', v_with_candidates;
  END IF;

  IF v_without_candidates <> 6 THEN
    RAISE EXCEPTION 'candidate pool check failed: expected 6 unresolved-without-candidates, got %', v_without_candidates;
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
    RAISE EXCEPTION 'duplicate CUSTOM refs detected: %', v_duplicate_custom_refs;
  END IF;

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
      COUNT(*)
    FROM food_fodmap_measurements AS ffm
    WHERE ffm.source_record_ref IN (
      'dysseler_hoffem_gos_chickpea_canned_drained_proxy',
      'dysseler_hoffem_gos_lentil_green_cooked_proxy',
      'dysseler_hoffem_gos_lentil_red_cooked_proxy',
      'dysseler_hoffem_gos_lentil_brown_cooked_proxy',
      'dysseler_hoffem_gos_white_bean_cooked_proxy',
      'dysseler_hoffem_gos_kidney_bean_cooked_proxy'
    )
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
    RAISE EXCEPTION 'duplicate wave measurement signatures detected: %', v_duplicate_measurements;
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
    RAISE EXCEPTION 'safety contract failed: rank 2 must remain without current measurement';
  END IF;
END $$;

SELECT
  'PASS' AS phase2_gos_wave01_checks,
  COUNT(*) FILTER (WHERE priority_rank IN (18,19,20,21,22,23) AND status = 'threshold_set') AS wave_threshold_set_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL) AS resolved_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NULL) AS unresolved_rows
FROM phase2_priority_foods;
