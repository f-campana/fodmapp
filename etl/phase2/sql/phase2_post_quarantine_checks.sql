\set ON_ERROR_STOP on

-- Phase 2.4 post-quarantine checks (rank 2 garlic powder).

SELECT
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL) AS resolved_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NULL) AS unresolved_rows
FROM phase2_priority_foods;

SELECT
  p.priority_rank,
  p.food_label,
  p.variant_label,
  p.status,
  ffm.measurement_id,
  ffm.amount_g_per_100g,
  ffm.amount_g_per_serving,
  ffm.is_current,
  ffm.source_record_ref,
  ffm.notes
FROM phase2_priority_foods AS p
JOIN fodmap_subtypes AS fst
  ON fst.code = 'fructan'
JOIN food_fodmap_measurements AS ffm
  ON ffm.food_id = p.resolved_food_id
 AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
WHERE p.priority_rank = 2
ORDER BY ffm.created_at DESC, ffm.measurement_id DESC;

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
)
SELECT
  COUNT(DISTINCT p.priority_rank) AS readiness_rows
FROM phase2_priority_foods AS p
JOIN locked_ranks AS l
  ON l.priority_rank = p.priority_rank
JOIN fodmap_subtypes AS fst
  ON fst.code = p.target_subtype
JOIN food_fodmap_measurements AS ffm
  ON ffm.food_id = p.resolved_food_id
 AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
 AND ffm.source_id IN (SELECT source_id FROM phase2_source_ids)
 AND ffm.is_current = TRUE
JOIN food_fodmap_thresholds AS fft
  ON fft.food_id = p.resolved_food_id
 AND fft.fodmap_subtype_id = fst.fodmap_subtype_id
 AND fft.source_id IN (SELECT source_id FROM threshold_source);

DO $$
DECLARE
  v_total_rows INTEGER;
  v_resolved_rows INTEGER;
  v_unresolved_rows INTEGER;
  v_no_candidate_rows INTEGER;
  v_rank2_current_rows INTEGER;
  v_rank2_quarantine_note_rows INTEGER;
  v_rank2_status TEXT;
  v_threshold_set_rows INTEGER;
  v_fructan_completed INTEGER;
  v_readiness_rows INTEGER;
BEGIN
  SELECT COUNT(*),
         COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL),
         COUNT(*) FILTER (WHERE resolved_food_id IS NULL)
  INTO v_total_rows, v_resolved_rows, v_unresolved_rows
  FROM phase2_priority_foods;

  IF v_total_rows <> 42 THEN
    RAISE EXCEPTION 'expected total_rows=42, got %', v_total_rows;
  END IF;

  IF v_resolved_rows <> 10 THEN
    RAISE EXCEPTION 'expected resolved_rows=10, got %', v_resolved_rows;
  END IF;

  IF v_unresolved_rows <> 32 THEN
    RAISE EXCEPTION 'expected unresolved_rows=32, got %', v_unresolved_rows;
  END IF;

  SELECT COUNT(*)
  INTO v_no_candidate_rows
  FROM phase2_priority_foods AS p
  WHERE p.resolved_food_id IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM v_phase2_resolution_candidates AS c
      WHERE c.priority_rank = p.priority_rank
    );

  IF v_no_candidate_rows <> 11 THEN
    RAISE EXCEPTION 'expected unresolved no-candidate pool=11, got %', v_no_candidate_rows;
  END IF;

  SELECT COUNT(*)
  INTO v_rank2_current_rows
  FROM phase2_priority_foods AS p
  JOIN fodmap_subtypes AS fst
    ON fst.code = 'fructan'
  JOIN food_fodmap_measurements AS ffm
    ON ffm.food_id = p.resolved_food_id
   AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
  WHERE p.priority_rank = 2
    AND ffm.is_current = TRUE;

  IF v_rank2_current_rows <> 0 THEN
    RAISE EXCEPTION 'expected rank2 current fructan rows=0, got %', v_rank2_current_rows;
  END IF;

  SELECT COUNT(*)
  INTO v_rank2_quarantine_note_rows
  FROM phase2_priority_foods AS p
  JOIN fodmap_subtypes AS fst
    ON fst.code = 'fructan'
  JOIN food_fodmap_measurements AS ffm
    ON ffm.food_id = p.resolved_food_id
   AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
  WHERE p.priority_rank = 2
    AND POSITION('QUARANTINED: amount_per_100g suspect, pending verification against Muir 2007 Table 2' IN COALESCE(ffm.notes, '')) > 0;

  IF v_rank2_quarantine_note_rows = 0 THEN
    RAISE EXCEPTION 'expected quarantine note on rank2 measurement row';
  END IF;

  SELECT status
  INTO v_rank2_status
  FROM phase2_priority_foods
  WHERE priority_rank = 2;

  IF v_rank2_status <> 'resolved' THEN
    RAISE EXCEPTION 'expected rank2 status=resolved, got %', v_rank2_status;
  END IF;

  SELECT COUNT(*)
  INTO v_threshold_set_rows
  FROM phase2_priority_foods
  WHERE priority_rank IN (1,2,4,5,14,15,34,39,40,41)
    AND status = 'threshold_set';

  IF v_threshold_set_rows <> 9 THEN
    RAISE EXCEPTION 'expected cohort threshold_set rows=9, got %', v_threshold_set_rows;
  END IF;

  SELECT completed_rows
  INTO v_fructan_completed
  FROM v_phase2_gap_completion
  WHERE gap_bucket = 'fructan_dominant'
    AND target_subtype = 'fructan';

  IF COALESCE(v_fructan_completed, -1) <> 5 THEN
    RAISE EXCEPTION 'expected fructan completed_rows=5, got %', COALESCE(v_fructan_completed, -1);
  END IF;

  SELECT COUNT(*) INTO v_readiness_rows
  FROM (
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
    )
    SELECT DISTINCT p.priority_rank
    FROM phase2_priority_foods AS p
    JOIN locked_ranks AS l
      ON l.priority_rank = p.priority_rank
    JOIN fodmap_subtypes AS fst
      ON fst.code = p.target_subtype
    JOIN food_fodmap_measurements AS ffm
      ON ffm.food_id = p.resolved_food_id
     AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
     AND ffm.source_id IN (SELECT source_id FROM phase2_source_ids)
     AND ffm.is_current = TRUE
    JOIN food_fodmap_thresholds AS fft
      ON fft.food_id = p.resolved_food_id
     AND fft.fodmap_subtype_id = fst.fodmap_subtype_id
     AND fft.source_id IN (SELECT source_id FROM threshold_source)
  ) AS ready_rows;

  IF v_readiness_rows <> 9 THEN
    RAISE EXCEPTION 'expected readiness rows=9, got %', v_readiness_rows;
  END IF;
END $$;

SELECT 'PASS' AS post_quarantine_checks;
