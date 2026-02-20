\set ON_ERROR_STOP on

BEGIN;

-- Phase 3.6 Batch B coverage uplift apply.
-- Scope: 7 high-impact 1/6 foods, missing subtype rows only.

CREATE TEMP TABLE stg_measurements (
  priority_rank INTEGER,
  food_slug TEXT,
  subtype_code TEXT,
  amount_raw TEXT,
  comparator comparator_code,
  amount_g_per_100g NUMERIC(12,6),
  serving_g NUMERIC(8,2),
  amount_g_per_serving NUMERIC(12,6),
  source_slug TEXT,
  citation_ref TEXT,
  evidence_tier evidence_tier,
  confidence_score NUMERIC(4,3),
  observed_at DATE,
  method TEXT,
  quarantine_flag BOOLEAN,
  notes TEXT
) ON COMMIT DROP;

\copy stg_measurements (priority_rank,food_slug,subtype_code,amount_raw,comparator,amount_g_per_100g,serving_g,amount_g_per_serving,source_slug,citation_ref,evidence_tier,confidence_score,observed_at,method,quarantine_flag,notes) FROM 'etl/phase3/data/phase3_coverage_batchB_measurements_v1.csv' WITH (FORMAT csv, HEADER true)

DO $$
DECLARE
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count FROM stg_measurements;
  IF bad_count < 1 THEN
    RAISE EXCEPTION 'coverage batchB staging file is empty';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE priority_rank NOT IN (9, 16, 24, 25, 26, 29, 32);
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage batchB contains rows outside locked rank scope';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE subtype_code NOT IN ('fructan', 'fructose', 'gos', 'lactose', 'mannitol', 'sorbitol');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage batchB contains invalid subtype codes';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE method NOT IN ('derived_from_nutrient', 'literature', 'expert_estimate');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage batchB contains unsupported method values (allowed: derived_from_nutrient, literature, expert_estimate)';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE source_slug NOT IN (
    'internal_rules_v1',
    'ciqual_2025',
    'monash_app_v4_reference',
    'muir_2007_fructan',
    'biesiekierski_2011_fructan',
    'yao_2005_polyols',
    'dysseler_hoffem_gos'
  );
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage batchB contains unsupported source_slug values';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE confidence_score < 0 OR confidence_score > 1;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage batchB confidence scores must be in [0,1]';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements s
  JOIN phase2_priority_foods p ON p.priority_rank = s.priority_rank
  JOIN foods f ON f.food_id = p.resolved_food_id
  WHERE f.food_slug <> s.food_slug;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage batchB slug/rank mismatch detected';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT priority_rank, subtype_code
    FROM stg_measurements
    GROUP BY priority_rank, subtype_code
    HAVING COUNT(*) > 1
  ) dups;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage batchB duplicate rank/subtype rows detected';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE notes IS NULL
     OR notes = ''
     OR notes NOT LIKE 'coverage_batchB_v1:%';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage batchB rows must use coverage_batchB_v1 notes markers';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE amount_g_per_100g IS NULL
     OR amount_g_per_serving IS NULL
     OR serving_g IS NULL
     OR citation_ref IS NULL
     OR citation_ref = '';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'coverage batchB rows must include amount + serving + citation fields';
  END IF;

  -- Plant lactose inference policy: explicit zero rows scoped by notes marker.
  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE notes LIKE 'coverage_batchB_v1:plant_lactose_zero_inference%'
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
    RAISE EXCEPTION 'plant_lactose_zero_inference rows must satisfy lactose=0 expert-estimate contract';
  END IF;

  -- Variant proxy policy: CIQUAL-linked proxy rows only for sorbitol/mannitol.
  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE notes LIKE 'coverage_batchB_v1:polyols_proxy_%'
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

  -- CIQUAL fructose/glucose derivation policy for excess fructose rows.
  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE notes LIKE 'coverage_batchB_v1:excess_from_ciqual%'
    AND (
      subtype_code <> 'fructose'
      OR source_slug <> 'ciqual_2025'
      OR method <> 'derived_from_nutrient'
      OR comparator NOT IN ('eq', 'lt', 'lte')
      OR evidence_tier <> 'inferred'
    );
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'excess_from_ciqual rows violate subtype/source/comparator policy';
  END IF;
END $$;

-- Idempotency: replace only prior batchB injected rows.
DELETE FROM food_fodmap_measurements m
USING phase2_priority_foods p, fodmap_subtypes fs
WHERE m.food_id = p.resolved_food_id
  AND m.fodmap_subtype_id = fs.fodmap_subtype_id
  AND p.priority_rank IN (9, 16, 24, 25, 26, 29, 32)
  AND m.source_id IN (
    SELECT source_id
    FROM sources
    WHERE source_slug IN (
      'internal_rules_v1',
      'ciqual_2025',
      'monash_app_v4_reference',
      'muir_2007_fructan',
      'biesiekierski_2011_fructan',
      'yao_2005_polyols',
      'dysseler_hoffem_gos'
    )
  )
  AND m.notes LIKE 'coverage_batchB_v1:%';

INSERT INTO food_fodmap_measurements (
  food_id,
  fodmap_subtype_id,
  source_id,
  source_record_ref,
  amount_raw,
  comparator,
  amount_g_per_100g,
  amount_g_per_serving,
  serving_g,
  method,
  evidence_tier,
  confidence_score,
  observed_at,
  is_current,
  notes
)
SELECT
  p.resolved_food_id,
  fs.fodmap_subtype_id,
  src.source_id,
  format('coverage_batchB_v1:%s:%s', s.priority_rank, s.subtype_code),
  s.amount_raw,
  s.comparator,
  s.amount_g_per_100g,
  s.amount_g_per_serving,
  s.serving_g,
  s.method,
  s.evidence_tier,
  s.confidence_score,
  s.observed_at,
  NOT s.quarantine_flag,
  s.notes
FROM stg_measurements s
JOIN phase2_priority_foods p ON p.priority_rank = s.priority_rank
JOIN fodmap_subtypes fs ON fs.code = s.subtype_code
JOIN sources src ON src.source_slug = s.source_slug;

SELECT
  COUNT(*) AS inserted_rows,
  COUNT(*) FILTER (WHERE is_current) AS inserted_current_rows,
  COUNT(*) FILTER (WHERE NOT is_current) AS inserted_quarantined_rows
FROM food_fodmap_measurements
WHERE notes LIKE 'coverage_batchB_v1:%';

COMMIT;
