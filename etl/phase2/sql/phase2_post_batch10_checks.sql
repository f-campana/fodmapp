\set ON_ERROR_STOP on

-- Phase 2.4 post-batch10 checks under current-measurement contract.
-- Expected state after rank2 quarantine + status sync:
-- - phase2_priority_foods total_rows = 42
-- - unresolved rows = 32
-- - unresolved no-candidate pool = 11
-- - cohort current-measurement coverage = 9/10
-- - cohort threshold coverage = 10/10
-- - cohort status threshold_set = 9/10

SELECT
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL) AS resolved_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NULL) AS unresolved_rows
FROM phase2_priority_foods;

SELECT
  p.priority_rank,
  p.food_label,
  p.variant_label,
  p.target_subtype,
  p.status,
  p.resolution_method,
  p.resolved_food_id
FROM phase2_priority_foods AS p
WHERE p.priority_rank IN (1,2,4,5,14,15,34,39,40,41)
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
    ELSE 9
  END,
  target_subtype;

DO $$
DECLARE
  v_total_rows INTEGER;
  v_unresolved_rows INTEGER;
  v_no_candidate_rows INTEGER;
  v_cohort_current_measurement_rows INTEGER;
  v_cohort_threshold_rows INTEGER;
  v_cohort_threshold_status_rows INTEGER;
  v_fructan_completed INTEGER;
  v_sorbitol_completed INTEGER;
  v_mannitol_completed INTEGER;
  v_batch_current_measurement_rows INTEGER;
BEGIN
  IF to_regclass('public.v_phase2_resolution_candidates') IS NULL THEN
    RAISE EXCEPTION 'required view missing: v_phase2_resolution_candidates';
  END IF;

  IF to_regclass('public.v_phase2_gap_completion') IS NULL THEN
    RAISE EXCEPTION 'required view missing: v_phase2_gap_completion';
  END IF;

  SELECT COUNT(*) INTO v_total_rows
  FROM phase2_priority_foods;

  IF v_total_rows <> 42 THEN
    RAISE EXCEPTION 'total row check failed: expected 42, got %', v_total_rows;
  END IF;

  SELECT COUNT(*) INTO v_unresolved_rows
  FROM phase2_priority_foods
  WHERE resolved_food_id IS NULL;

  IF v_unresolved_rows <> 32 THEN
    RAISE EXCEPTION 'unresolved row check failed: expected 32, got %', v_unresolved_rows;
  END IF;

  SELECT COUNT(*) INTO v_no_candidate_rows
  FROM phase2_priority_foods AS p
  WHERE p.resolved_food_id IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM v_phase2_resolution_candidates AS c
      WHERE c.priority_rank = p.priority_rank
    );

  IF v_no_candidate_rows <> 11 THEN
    RAISE EXCEPTION 'no-candidate carryover check failed: expected 11, got %', v_no_candidate_rows;
  END IF;

  WITH phase2_source_ids AS (
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
  SELECT COUNT(*) INTO v_cohort_current_measurement_rows
  FROM phase2_priority_foods AS p
  JOIN fodmap_subtypes AS fst
    ON fst.code = p.target_subtype
  WHERE p.priority_rank IN (1,2,4,5,14,15,34,39,40,41)
    AND EXISTS (
      SELECT 1
      FROM food_fodmap_measurements AS ffm
      WHERE ffm.food_id = p.resolved_food_id
        AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
        AND ffm.source_id IN (SELECT source_id FROM phase2_source_ids)
        AND ffm.is_current = TRUE
    );

  IF v_cohort_current_measurement_rows <> 9 THEN
    RAISE EXCEPTION 'cohort current-measurement coverage check failed: expected 9, got %', v_cohort_current_measurement_rows;
  END IF;

  SELECT COUNT(*) INTO v_cohort_threshold_rows
  FROM phase2_priority_foods AS p
  JOIN fodmap_subtypes AS fst
    ON fst.code = p.target_subtype
  JOIN sources AS s
    ON s.source_slug = 'monash_app_v4_reference'
  WHERE p.priority_rank IN (1,2,4,5,14,15,34,39,40,41)
    AND EXISTS (
      SELECT 1
      FROM food_fodmap_thresholds AS fft
      WHERE fft.food_id = p.resolved_food_id
        AND fft.fodmap_subtype_id = fst.fodmap_subtype_id
        AND fft.source_id = s.source_id
    );

  IF v_cohort_threshold_rows <> 10 THEN
    RAISE EXCEPTION 'cohort threshold coverage check failed: expected 10, got %', v_cohort_threshold_rows;
  END IF;

  SELECT COUNT(*) INTO v_cohort_threshold_status_rows
  FROM phase2_priority_foods
  WHERE priority_rank IN (1,2,4,5,14,15,34,39,40,41)
    AND status = 'threshold_set';

  IF v_cohort_threshold_status_rows <> 9 THEN
    RAISE EXCEPTION 'cohort status check failed: expected 9 threshold_set rows, got %', v_cohort_threshold_status_rows;
  END IF;

  SELECT completed_rows INTO v_fructan_completed
  FROM v_phase2_gap_completion
  WHERE gap_bucket = 'fructan_dominant'
    AND target_subtype = 'fructan';

  IF COALESCE(v_fructan_completed, -1) <> 5 THEN
    RAISE EXCEPTION 'gap completion check failed for fructan_dominant/fructan: expected 5, got %', COALESCE(v_fructan_completed, -1);
  END IF;

  SELECT completed_rows INTO v_sorbitol_completed
  FROM v_phase2_gap_completion
  WHERE gap_bucket = 'polyol_split_needed'
    AND target_subtype = 'sorbitol';

  IF COALESCE(v_sorbitol_completed, -1) <> 1 THEN
    RAISE EXCEPTION 'gap completion check failed for polyol_split_needed/sorbitol: expected 1, got %', COALESCE(v_sorbitol_completed, -1);
  END IF;

  SELECT completed_rows INTO v_mannitol_completed
  FROM v_phase2_gap_completion
  WHERE gap_bucket = 'polyol_split_needed'
    AND target_subtype = 'mannitol';

  IF COALESCE(v_mannitol_completed, -1) <> 3 THEN
    RAISE EXCEPTION 'gap completion check failed for polyol_split_needed/mannitol: expected 3, got %', COALESCE(v_mannitol_completed, -1);
  END IF;

  SELECT COUNT(*) INTO v_batch_current_measurement_rows
  FROM food_fodmap_measurements AS ffm
  WHERE ffm.source_record_ref IN (
    'muir2007_fructan_table_v1',
    'biesiekierski2011_fructan_trial_v1',
    'yao2005_polyols_table_v1'
  )
    AND ffm.food_id IN (
      SELECT resolved_food_id
      FROM phase2_priority_foods
      WHERE priority_rank IN (1,2,4,5,14,15,34,39,40,41)
    )
    AND ffm.is_current = TRUE;

  IF v_batch_current_measurement_rows <> 9 THEN
    RAISE EXCEPTION 'batch current measurement row count failed: expected 9, got %', v_batch_current_measurement_rows;
  END IF;
END $$;

SELECT
  'PASS' AS post_batch10_checks,
  COUNT(*) FILTER (WHERE priority_rank IN (1,2,4,5,14,15,34,39,40,41) AND status = 'threshold_set') AS cohort_threshold_set_rows
FROM phase2_priority_foods;
