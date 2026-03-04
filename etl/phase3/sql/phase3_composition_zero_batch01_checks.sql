\set ON_ERROR_STOP on

BEGIN;

CREATE TEMP TABLE stg_matrix (
  priority_rank INTEGER,
  food_slug TEXT,
  cohort_code TEXT,
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

\copy stg_matrix (priority_rank,food_slug,cohort_code,subtype_code,known_before,measurement_found,source_citation,value_raw,unit,basis,comparator,amount_g_per_100g,serving_g,amount_g_per_serving,method,evidence_tier,confidence_score,quarantine_flag,blocked_reason,notes) FROM 'etl/phase3/research/phase3_composition_zero_batch01_matrix_v1.csv' WITH (FORMAT csv, HEADER true)

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

\copy stg_measurements (priority_rank,food_slug,subtype_code,amount_raw,comparator,amount_g_per_100g,serving_g,amount_g_per_serving,source_slug,citation_ref,evidence_tier,confidence_score,observed_at,method,quarantine_flag,notes) FROM 'etl/phase3/data/phase3_composition_zero_batch01_measurements_v1.csv' WITH (FORMAT csv, HEADER true)

DO $$
DECLARE
  bad_count INTEGER;
  matrix_count INTEGER;
  found_count INTEGER;
  csv_count INTEGER;
  db_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO matrix_count FROM stg_matrix;
  IF matrix_count <> 6 THEN
    RAISE EXCEPTION 'composition matrix must contain 6 rows, got %', matrix_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_matrix
  WHERE priority_rank <> 3
     OR cohort_code <> 'cohort_oil_fat'
     OR subtype_code NOT IN ('fructan', 'fructose', 'gos', 'lactose', 'mannitol', 'sorbitol');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'composition matrix contains out-of-scope rank/cohort/subtype values';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT priority_rank, subtype_code
    FROM stg_matrix
    GROUP BY priority_rank, subtype_code
    HAVING COUNT(*) > 1
  ) dups;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'composition matrix contains duplicate rank/subtype rows';
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
      OR COALESCE(notes, '') = ''
    );
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'composition matrix has found rows missing required evidence fields';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_matrix
  WHERE measurement_found = FALSE
    AND COALESCE(blocked_reason, '') = '';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'composition matrix has blocked rows without blocked_reason';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_matrix
  WHERE measurement_found = FALSE
    AND blocked_reason NOT IN (
      'not_single_ingredient_food',
      'processing_risk_additives',
      'missing_official_support',
      'evidence_conflict_not_promotable',
      'unknown_identity_or_prep'
    );
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'composition matrix has blocked rows outside allowed taxonomy';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_matrix
  WHERE measurement_found = FALSE
    AND blocked_reason = 'insufficient_variant_specific_evidence';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'forbidden blocked reason present: insufficient_variant_specific_evidence';
  END IF;

  SELECT COUNT(*) INTO found_count
  FROM stg_matrix
  WHERE measurement_found = TRUE;

  IF found_count <> 6 THEN
    RAISE EXCEPTION 'composition matrix found row count must be 6 in batch01, got %', found_count;
  END IF;

  SELECT COUNT(*) INTO csv_count FROM stg_measurements;
  IF csv_count <> found_count THEN
    RAISE EXCEPTION 'measurements CSV row count (%) must equal matrix found row count (%)', csv_count, found_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE priority_rank <> 3
     OR subtype_code NOT IN ('fructan', 'fructose', 'gos', 'lactose', 'mannitol', 'sorbitol')
     OR amount_raw <> '0'
     OR comparator <> 'eq'
     OR amount_g_per_100g <> 0
     OR amount_g_per_serving <> 0
     OR serving_g <> 14
     OR source_slug <> 'internal_rules_v1'
     OR method <> 'expert_estimate'
     OR evidence_tier <> 'inferred'
     OR confidence_score <> 0.950
     OR COALESCE(citation_ref, '') = ''
     OR COALESCE(notes, '') = ''
     OR notes NOT LIKE 'composition_zero_batch01_v1:cohort_oil_fat;%'
     OR notes NOT LIKE '%gate:single_ingredient=1%'
     OR notes NOT LIKE '%gate:processing_risk=0%';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'measurements CSV violates composition batch01 policy contract';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT priority_rank, subtype_code
    FROM stg_measurements
    GROUP BY priority_rank, subtype_code
    HAVING COUNT(*) > 1
  ) dups;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'measurements CSV contains duplicate rank/subtype rows';
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

  SELECT COUNT(*) INTO db_count
  FROM food_fodmap_measurements
  WHERE notes LIKE 'composition_zero_batch01_v1:%'
    AND is_current = TRUE;
  IF db_count <> csv_count THEN
    RAISE EXCEPTION 'current DB rows from composition_zero_batch01_v1 (%) must equal CSV count (%)', db_count, csv_count;
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
    RAISE EXCEPTION 'explicit precedence check failed for composition batch01 rows';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE priority_rank = 2;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'rank 2 exclusion violated in composition batch01';
  END IF;
END $$;

SELECT
  v.priority_rank,
  f.food_slug,
  v.subtype_code,
  v.subtype_level,
  v.signal_source_kind,
  v.signal_source_slug,
  v.threshold_source_slug
FROM v_phase3_rollup_subtype_levels_latest v
JOIN foods f ON f.food_id = v.food_id
WHERE v.priority_rank = 3
ORDER BY v.subtype_code;

SELECT
  v.priority_rank,
  f.food_slug,
  v.known_subtypes_count,
  v.coverage_ratio,
  v.overall_level,
  v.driver_subtype_code
FROM v_phase3_rollups_latest_full v
JOIN foods f ON f.food_id = v.food_id
WHERE v.priority_rank = 3;

COMMIT;
