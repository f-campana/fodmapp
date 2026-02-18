\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  bad_count INTEGER;
BEGIN
  -- Structural row counts.
  SELECT COUNT(*) INTO bad_count
  FROM v_phase3_rollups_latest_full;
  IF bad_count <> 42 THEN
    RAISE EXCEPTION 'rollups_latest_full row count failed: expected 42, got %', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM v_phase3_rollup_subtype_levels_latest;
  IF bad_count <> 252 THEN
    RAISE EXCEPTION 'rollup_subtype_levels_latest row count failed: expected 252, got %', bad_count;
  END IF;

  -- Coverage fields valid.
  SELECT COUNT(*) INTO bad_count
  FROM v_phase3_rollups_latest_full
  WHERE known_subtypes_count < 0
     OR known_subtypes_count > 6
     OR ABS(coverage_ratio - (known_subtypes_count::NUMERIC / 6.0)) > 0.0001;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage field validation failed on % rows', bad_count;
  END IF;

  -- None-gate: no partial-coverage none.
  SELECT COUNT(*) INTO bad_count
  FROM v_phase3_rollups_latest_full
  WHERE overall_level = 'none'
    AND known_subtypes_count <> 6;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'none-gate failed: partial coverage rows cannot be none';
  END IF;

  -- If partial coverage and all known are none, overall must be unknown.
  WITH known_none AS (
    SELECT
      f.priority_rank,
      COUNT(*) FILTER (WHERE d.subtype_level <> 'unknown') AS known_count,
      BOOL_AND(d.subtype_level = 'none') FILTER (WHERE d.subtype_level <> 'unknown') AS all_known_none
    FROM v_phase3_rollups_latest_full f
    JOIN v_phase3_rollup_subtype_levels_latest d USING(priority_rank)
    GROUP BY f.priority_rank
  )
  SELECT COUNT(*) INTO bad_count
  FROM known_none k
  JOIN v_phase3_rollups_latest_full f USING(priority_rank)
  WHERE k.known_count > 0
    AND k.known_count < 6
    AND k.all_known_none
    AND f.overall_level <> 'unknown';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'none-gate failed: partial all-none foods must be unknown';
  END IF;

  -- Proxy precedence: explicit subtype signal must win over total-polyols proxy.
  SELECT COUNT(*) INTO bad_count
  FROM v_phase3_rollup_subtype_levels_latest d
  WHERE d.subtype_code IN ('sorbitol', 'mannitol')
    AND d.is_polyol_proxy = TRUE
    AND EXISTS (
      SELECT 1
      FROM food_fodmap_measurements ffm
      JOIN fodmap_subtypes fs ON fs.fodmap_subtype_id = ffm.fodmap_subtype_id
      WHERE ffm.food_id = d.food_id
        AND ffm.is_current = TRUE
        AND fs.code = d.subtype_code
    );
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'proxy precedence failed: found proxy rows where explicit subtype signals exist';
  END IF;

  -- Threshold provenance: all rows must resolve threshold source; default rows require citation metadata.
  SELECT COUNT(*) INTO bad_count
  FROM v_phase3_rollup_subtype_levels_latest
  WHERE threshold_source NOT IN ('food_specific', 'global_default')
     OR threshold_source_slug IS NULL;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'threshold provenance missing/invalid on % subtype rows', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM v_phase3_rollup_subtype_levels_latest
  WHERE is_default_threshold = TRUE
    AND (
      default_threshold_citation_ref IS NULL OR default_threshold_citation_ref = ''
      OR default_threshold_derivation_method IS NULL OR default_threshold_derivation_method = ''
    );
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'default threshold citation/derivation metadata missing on % rows', bad_count;
  END IF;

  -- Driver invariants.
  SELECT COUNT(*) INTO bad_count
  FROM v_phase3_rollups_latest_full
  WHERE overall_level IN ('unknown', 'none')
    AND driver_subtype_code IS NOT NULL;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'driver invariant failed: unknown/none rows must have NULL driver';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM v_phase3_rollups_latest_full
  WHERE overall_level IN ('low', 'moderate', 'high')
    AND driver_subtype_code IS NULL;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'driver invariant failed: low/moderate/high rows must have non-NULL driver';
  END IF;

  -- Scope lock to ranks 1..42.
  SELECT COUNT(*) INTO bad_count
  FROM v_phase3_rollups_latest_full f
  LEFT JOIN phase2_priority_foods p
    ON p.priority_rank = f.priority_rank
   AND p.resolved_food_id = f.food_id
  WHERE p.priority_rank IS NULL
     OR p.priority_rank NOT BETWEEN 1 AND 42;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'scope lock failed: rollup view includes rows outside priority ranks 1..42';
  END IF;
END $$;

-- Diagnostic readouts (non-blocking):
SELECT overall_level, COUNT(*) AS row_count
FROM v_phase3_rollups_latest_full
GROUP BY overall_level
ORDER BY overall_level;

SELECT known_subtypes_count, COUNT(*) AS foods
FROM v_phase3_rollups_latest_full
GROUP BY known_subtypes_count
ORDER BY known_subtypes_count;

SELECT
  threshold_source,
  COUNT(*) AS rows
FROM v_phase3_rollup_subtype_levels_latest
GROUP BY threshold_source
ORDER BY threshold_source;

SELECT
  subtype_code,
  COUNT(*) FILTER (WHERE is_polyol_proxy) AS proxy_rows,
  COUNT(*) FILTER (WHERE signal_source_kind = 'explicit_measurement') AS explicit_rows
FROM v_phase3_rollup_subtype_levels_latest
GROUP BY subtype_code
ORDER BY subtype_code;

COMMIT;
