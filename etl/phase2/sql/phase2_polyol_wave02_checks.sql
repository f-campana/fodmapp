\set ON_ERROR_STOP on

-- Phase 2.7 Polyol Wave 2 hard checks

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
WHERE p.priority_rank IN (37,38,42)
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
WHERE gap_bucket = 'polyol_split_needed'
  AND target_subtype = 'mannitol';

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
  v_polyol_priority INTEGER;
  v_polyol_resolved INTEGER;
  v_polyol_completed INTEGER;
  v_polyol_unresolved INTEGER;
  v_polyol_pending INTEGER;
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

  IF v_resolved_links <> 42 THEN
    RAISE EXCEPTION 'resolved links check failed: expected 42, got %', v_resolved_links;
  END IF;

  IF v_unresolved_rows <> 0 THEN
    RAISE EXCEPTION 'unresolved check failed: expected 0, got %', v_unresolved_rows;
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL),
    COUNT(*) FILTER (WHERE status = 'threshold_set')
  INTO v_wave_resolved, v_wave_threshold_set
  FROM phase2_priority_foods
  WHERE priority_rank IN (37,38,42);

  IF v_wave_resolved <> 3 THEN
    RAISE EXCEPTION 'wave resolution check failed: expected 3 resolved, got %', v_wave_resolved;
  END IF;

  IF v_wave_threshold_set <> 3 THEN
    RAISE EXCEPTION 'wave status check failed: expected 3 threshold_set, got %', v_wave_threshold_set;
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
  WHERE p.priority_rank IN (37,38,42)
    AND EXISTS (
      SELECT 1
      FROM food_fodmap_measurements AS ffm
      WHERE ffm.food_id = p.resolved_food_id
        AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
        AND ffm.source_id IN (SELECT source_id FROM phase2_sources)
        AND ffm.is_current = TRUE
    );

  IF v_wave_measurements <> 3 THEN
    RAISE EXCEPTION 'wave measurement coverage failed: expected 3, got %', v_wave_measurements;
  END IF;

  SELECT COUNT(*) INTO v_wave_thresholds
  FROM phase2_priority_foods AS p
  JOIN fodmap_subtypes AS fst
    ON fst.code = p.target_subtype
  JOIN sources AS s
    ON s.source_slug = 'monash_app_v4_reference'
  WHERE p.priority_rank IN (37,38,42)
    AND EXISTS (
      SELECT 1
      FROM food_fodmap_thresholds AS fft
      WHERE fft.food_id = p.resolved_food_id
        AND fft.fodmap_subtype_id = fst.fodmap_subtype_id
        AND fft.source_id = s.source_id
    );

  IF v_wave_thresholds <> 3 THEN
    RAISE EXCEPTION 'wave threshold coverage failed: expected 3, got %', v_wave_thresholds;
  END IF;

  SELECT
    priority_rows,
    resolved_rows,
    completed_rows,
    unresolved_rows,
    pending_measurement_rows
  INTO v_polyol_priority, v_polyol_resolved, v_polyol_completed, v_polyol_unresolved, v_polyol_pending
  FROM v_phase2_gap_completion
  WHERE gap_bucket = 'polyol_split_needed'
    AND target_subtype = 'mannitol';

  IF COALESCE(v_polyol_priority, -1) <> 6 THEN
    RAISE EXCEPTION 'polyol mannitol priority check failed: expected 6, got %', COALESCE(v_polyol_priority, -1);
  END IF;

  IF COALESCE(v_polyol_resolved, -1) <> 6 THEN
    RAISE EXCEPTION 'polyol mannitol resolved check failed: expected 6, got %', COALESCE(v_polyol_resolved, -1);
  END IF;

  IF COALESCE(v_polyol_completed, -1) <> 6 THEN
    RAISE EXCEPTION 'polyol mannitol completed check failed: expected 6, got %', COALESCE(v_polyol_completed, -1);
  END IF;

  IF COALESCE(v_polyol_unresolved, -1) <> 0 THEN
    RAISE EXCEPTION 'polyol mannitol unresolved check failed: expected 0, got %', COALESCE(v_polyol_unresolved, -1);
  END IF;

  IF COALESCE(v_polyol_pending, -1) <> 0 THEN
    RAISE EXCEPTION 'polyol mannitol pending check failed: expected 0, got %', COALESCE(v_polyol_pending, -1);
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
      'yao2005_polyols_button_mushroom_proxy',
      'yao2005_polyols_shiitake_proxy',
      'yao2005_polyols_celery_stalk_proxy'
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
  'PASS' AS phase2_polyol_wave02_checks,
  COUNT(*) FILTER (WHERE priority_rank IN (37,38,42) AND status = 'threshold_set') AS wave_threshold_set_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL) AS resolved_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NULL) AS unresolved_rows
FROM phase2_priority_foods;

WITH latest_measurements AS (
  SELECT DISTINCT ON (p.priority_rank)
    p.priority_rank,
    ffm.amount_g_per_serving
  FROM phase2_priority_foods AS p
  JOIN fodmap_subtypes AS fst
    ON fst.code = p.target_subtype
  JOIN food_fodmap_measurements AS ffm
    ON ffm.food_id = p.resolved_food_id
   AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
   AND ffm.is_current = TRUE
  JOIN sources AS s
    ON s.source_id = ffm.source_id
   AND s.source_slug = 'yao_2005_polyols'
  WHERE p.priority_rank IN (37,38,42)
  ORDER BY p.priority_rank, ffm.observed_at DESC, ffm.measurement_id DESC
),
latest_thresholds AS (
  SELECT DISTINCT ON (p.priority_rank)
    p.priority_rank,
    fft.low_max_g,
    fft.moderate_max_g
  FROM phase2_priority_foods AS p
  JOIN fodmap_subtypes AS fst
    ON fst.code = p.target_subtype
  JOIN food_fodmap_thresholds AS fft
    ON fft.food_id = p.resolved_food_id
   AND fft.fodmap_subtype_id = fst.fodmap_subtype_id
  JOIN sources AS s
    ON s.source_id = fft.source_id
   AND s.source_slug = 'monash_app_v4_reference'
  WHERE p.priority_rank IN (37,38,42)
  ORDER BY p.priority_rank, fft.valid_from DESC, fft.threshold_id DESC
)
SELECT
  p.priority_rank,
  p.food_label,
  p.variant_label,
  lm.amount_g_per_serving,
  lt.low_max_g,
  lt.moderate_max_g,
  CASE
    WHEN lm.amount_g_per_serving <= lt.low_max_g THEN 'low'
    WHEN lm.amount_g_per_serving <= lt.moderate_max_g THEN 'moderate'
    ELSE 'high'
  END AS serving_band
FROM phase2_priority_foods AS p
JOIN latest_measurements AS lm
  ON lm.priority_rank = p.priority_rank
JOIN latest_thresholds AS lt
  ON lt.priority_rank = p.priority_rank
WHERE p.priority_rank IN (37,38,42)
ORDER BY p.priority_rank;
