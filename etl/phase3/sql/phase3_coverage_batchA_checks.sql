\set ON_ERROR_STOP on

BEGIN;

CREATE TEMP TABLE stg_matrix (
  priority_rank INTEGER,
  food_slug TEXT,
  subtype_code TEXT,
  known_before BOOLEAN,
  measurement_found BOOLEAN,
  source_citation TEXT,
  value_raw TEXT,
  unit TEXT,
  basis TEXT,
  comparator TEXT,
  amount_g_per_100g NUMERIC,
  serving_g NUMERIC,
  amount_g_per_serving NUMERIC,
  method TEXT,
  evidence_tier TEXT,
  confidence_score NUMERIC,
  quarantine_flag BOOLEAN,
  blocked_reason TEXT,
  notes TEXT
) ON COMMIT DROP;

\copy stg_matrix (priority_rank,food_slug,subtype_code,known_before,measurement_found,source_citation,value_raw,unit,basis,comparator,amount_g_per_100g,serving_g,amount_g_per_serving,method,evidence_tier,confidence_score,quarantine_flag,blocked_reason,notes) FROM 'etl/phase3/research/phase3_coverage_batchA_matrix_v1.csv' WITH (FORMAT csv, HEADER true)

CREATE TEMP TABLE stg_measurements (
  priority_rank INTEGER,
  food_slug TEXT,
  subtype_code TEXT,
  amount_raw TEXT,
  comparator TEXT,
  amount_g_per_100g NUMERIC,
  serving_g NUMERIC,
  amount_g_per_serving NUMERIC,
  source_slug TEXT,
  citation_ref TEXT,
  evidence_tier TEXT,
  confidence_score NUMERIC,
  observed_at DATE,
  method TEXT,
  quarantine_flag BOOLEAN,
  notes TEXT
) ON COMMIT DROP;

\copy stg_measurements (priority_rank,food_slug,subtype_code,amount_raw,comparator,amount_g_per_100g,serving_g,amount_g_per_serving,source_slug,citation_ref,evidence_tier,confidence_score,observed_at,method,quarantine_flag,notes) FROM 'etl/phase3/data/phase3_coverage_batchA_measurements_v1.csv' WITH (FORMAT csv, HEADER true)

DO $$
DECLARE
  bad_count INTEGER;
  matrix_count INTEGER;
  found_count INTEGER;
  csv_count INTEGER;
  db_count INTEGER;
  low_coverage_targets INTEGER;
BEGIN
  SELECT COUNT(*) INTO matrix_count FROM stg_matrix;
  IF matrix_count <> 30 THEN
    RAISE EXCEPTION 'coverage matrix must contain 30 missing subtype rows, got %', matrix_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_matrix
  WHERE priority_rank NOT IN (18, 21, 12, 38, 7, 11)
     OR subtype_code NOT IN ('fructan', 'fructose', 'gos', 'lactose', 'mannitol', 'sorbitol');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage matrix contains out-of-scope rank/subtype values';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT priority_rank, subtype_code
    FROM stg_matrix
    GROUP BY priority_rank, subtype_code
    HAVING COUNT(*) > 1
  ) dups;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage matrix contains duplicate rank/subtype rows';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_matrix
  WHERE measurement_found = TRUE
    AND (
      COALESCE(source_citation, '') = ''
      OR amount_g_per_100g IS NULL
      OR amount_g_per_serving IS NULL
      OR serving_g IS NULL
      OR COALESCE(method, '') = ''
      OR confidence_score IS NULL
    );
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage matrix has found rows missing required evidence fields';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_matrix
  WHERE measurement_found = FALSE
    AND COALESCE(blocked_reason, '') = '';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage matrix has blocked rows without blocked_reason';
  END IF;

  SELECT COUNT(*) INTO found_count
  FROM stg_matrix
  WHERE measurement_found = TRUE;

  SELECT COUNT(*) INTO csv_count
  FROM stg_measurements;

  IF csv_count <> found_count THEN
    RAISE EXCEPTION 'measurements CSV row count (%) must equal matrix found row count (%)', csv_count, found_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements c
  LEFT JOIN stg_matrix m
    ON m.priority_rank = c.priority_rank
   AND m.food_slug = c.food_slug
   AND m.subtype_code = c.subtype_code
   AND m.measurement_found = TRUE
  WHERE m.priority_rank IS NULL;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'measurements CSV includes rows not marked measurement_found=true in matrix';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_matrix m
  LEFT JOIN stg_measurements c
    ON c.priority_rank = m.priority_rank
   AND c.food_slug = m.food_slug
   AND c.subtype_code = m.subtype_code
  WHERE m.measurement_found = TRUE
    AND c.priority_rank IS NULL;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'matrix found rows missing in measurements CSV';
  END IF;

  -- Method/source policy guards.
  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE method NOT IN ('derived_from_nutrient', 'expert_estimate')
     OR source_slug NOT IN ('ciqual_2025', 'internal_rules_v1');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage batchA contains unsupported method/source combinations';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE notes LIKE 'coverage_batchA_v1:plant_lactose_zero_inference%'
    AND (
      subtype_code <> 'lactose'
      OR source_slug <> 'internal_rules_v1'
      OR method <> 'expert_estimate'
      OR comparator <> 'eq'
      OR amount_g_per_100g <> 0
      OR amount_g_per_serving <> 0
      OR evidence_tier <> 'inferred'
      OR confidence_score < 0.95
    );
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'plant_lactose_zero_inference rows violate lactose-zero policy';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE notes LIKE 'coverage_batchA_v1:polyols_proxy_%'
    AND (
      subtype_code NOT IN ('sorbitol', 'mannitol')
      OR source_slug <> 'ciqual_2025'
      OR method <> 'derived_from_nutrient'
      OR comparator NOT IN ('lt', 'lte', 'eq')
      OR evidence_tier <> 'inferred'
    );
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'polyols proxy rows violate subtype/source/comparator policy';
  END IF;

  SELECT COUNT(*) INTO db_count
  FROM food_fodmap_measurements
  WHERE notes LIKE 'coverage_batchA_v1:%'
    AND is_current = TRUE;
  IF db_count <> csv_count THEN
    RAISE EXCEPTION 'current DB rows from coverage_batchA_v1 (%) must equal CSV count (%)', db_count, csv_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements s
  JOIN phase2_priority_foods p ON p.priority_rank = s.priority_rank
  JOIN v_phase3_rollup_subtype_levels_latest v
    ON v.priority_rank = s.priority_rank
   AND v.food_id = p.resolved_food_id
   AND v.subtype_code = s.subtype_code
  WHERE v.signal_source_kind <> 'explicit_measurement';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'explicit precedence check failed for % coverage batch rows', bad_count;
  END IF;

  -- Coverage should not regress for target scope.
  SELECT COUNT(*) INTO bad_count
  FROM v_phase3_rollups_latest_full
  WHERE priority_rank IN (18, 21, 12, 38, 7, 11)
    AND known_subtypes_count < 1;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage regression: found target rows with known_subtypes_count < 1';
  END IF;

  -- Expected uplift for exact CIQUAL flour matches.
  SELECT COUNT(*) INTO bad_count
  FROM v_phase3_rollups_latest_full
  WHERE priority_rank = 11
    AND known_subtypes_count < 4;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage uplift expectation failed for rank 11 (expected >=4 known subtypes)';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM v_phase3_rollups_latest_full
  WHERE priority_rank = 12
    AND known_subtypes_count < 5;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage uplift expectation failed for rank 12 (expected >=5 known subtypes)';
  END IF;

  -- Priority targets in Batch A: expected uplift to >=3 known subtypes for ranks 18 and 21.
  SELECT COUNT(*) INTO bad_count
  FROM v_phase3_rollups_latest_full
  WHERE priority_rank = 18
    AND known_subtypes_count < 3;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage uplift expectation failed for rank 18 (expected >=3 known subtypes)';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM v_phase3_rollups_latest_full
  WHERE priority_rank = 21
    AND known_subtypes_count < 3;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage uplift expectation failed for rank 21 (expected >=3 known subtypes)';
  END IF;

  -- Plant lactose inference should lift ranks 7 and 38 to at least 2 known subtypes.
  SELECT COUNT(*) INTO bad_count
  FROM v_phase3_rollups_latest_full
  WHERE priority_rank IN (7, 38)
    AND known_subtypes_count < 2;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage uplift expectation failed for plant lactose-zero inference rows (ranks 7/38)';
  END IF;

  -- Batch quality diagnostic: should not worsen vs pre-uplift baseline (29 of 79).
  SELECT COUNT(*) INTO low_coverage_targets
  FROM swap_rules r
  JOIN phase2_priority_foods pto ON pto.resolved_food_id = r.to_food_id
  JOIN v_phase3_rollups_latest_full vt ON vt.priority_rank = pto.priority_rank
  WHERE r.notes IN ('phase3_batch01_rule', 'phase3_batch02_rule')
    AND vt.coverage_ratio < 0.50;

  IF low_coverage_targets > 29 THEN
    RAISE EXCEPTION 'coverage impact regression: low-coverage target count increased above baseline 29 (got %)', low_coverage_targets;
  END IF;
END $$;

SELECT
  v.priority_rank,
  f.food_slug,
  v.known_subtypes_count,
  v.coverage_ratio,
  v.overall_level,
  v.driver_subtype_code
FROM v_phase3_rollups_latest_full v
JOIN foods f ON f.food_id = v.food_id
WHERE v.priority_rank IN (18, 21, 12, 38, 7, 11)
ORDER BY v.priority_rank;

SELECT
  r.notes,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE vt.coverage_ratio < 0.50) AS low_coverage_target_rows
FROM swap_rules r
JOIN phase2_priority_foods pto ON pto.resolved_food_id = r.to_food_id
JOIN v_phase3_rollups_latest_full vt ON vt.priority_rank = pto.priority_rank
WHERE r.notes IN ('phase3_batch01_rule', 'phase3_batch02_rule')
GROUP BY r.notes
ORDER BY r.notes;

COMMIT;
