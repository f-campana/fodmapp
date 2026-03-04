\set ON_ERROR_STOP on

BEGIN;

-- Phase 3.6d Composition-Zero Batch01 apply.
-- Scope: current pilot universe, oil cohort rows only (rank 3 in Batch01).

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

\copy stg_measurements (priority_rank,food_slug,subtype_code,amount_raw,comparator,amount_g_per_100g,serving_g,amount_g_per_serving,source_slug,citation_ref,evidence_tier,confidence_score,observed_at,method,quarantine_flag,notes) FROM 'etl/phase3/data/phase3_composition_zero_batch01_measurements_v1.csv' WITH (FORMAT csv, HEADER true)

DO $$
DECLARE
  bad_count INTEGER;
  subtype_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count FROM stg_measurements;
  IF bad_count <> 6 THEN
    RAISE EXCEPTION 'composition_zero_batch01 staging row count must be 6, got %', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE priority_rank <> 3;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'composition_zero_batch01 contains rows outside locked rank scope (rank 3 only)';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE subtype_code NOT IN ('fructan', 'fructose', 'gos', 'lactose', 'mannitol', 'sorbitol');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'composition_zero_batch01 contains invalid subtype codes';
  END IF;

  SELECT COUNT(DISTINCT subtype_code) INTO subtype_count
  FROM stg_measurements;
  IF subtype_count <> 6 THEN
    RAISE EXCEPTION 'composition_zero_batch01 must cover all 6 subtype codes, got % distinct', subtype_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT priority_rank, subtype_code
    FROM stg_measurements
    GROUP BY priority_rank, subtype_code
    HAVING COUNT(*) > 1
  ) dups;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'composition_zero_batch01 duplicate rank/subtype rows detected';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements s
  JOIN phase2_priority_foods p ON p.priority_rank = s.priority_rank
  JOIN foods f ON f.food_id = p.resolved_food_id
  WHERE f.food_slug <> s.food_slug;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'composition_zero_batch01 slug/rank mismatch detected';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE method <> 'expert_estimate'
     OR source_slug <> 'internal_rules_v1'
     OR evidence_tier <> 'inferred'
     OR confidence_score <> 0.950;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'composition_zero_batch01 method/source/evidence/confidence policy violated';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE amount_raw <> '0'
     OR comparator <> 'eq'
     OR amount_g_per_100g <> 0
     OR amount_g_per_serving <> 0
     OR serving_g <> 14;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'composition_zero_batch01 zero-value contract violated';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_measurements
  WHERE citation_ref IS NULL
     OR citation_ref = ''
     OR notes IS NULL
     OR notes = ''
     OR notes NOT LIKE 'composition_zero_batch01_v1:cohort_oil_fat;%'
     OR notes NOT LIKE '%gate:single_ingredient=1%'
     OR notes NOT LIKE '%gate:processing_risk=0%';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'composition_zero_batch01 citation/notes marker contract violated';
  END IF;
END $$;

-- Idempotency: replace only prior composition batch01 rows in locked scope.
DELETE FROM food_fodmap_measurements m
USING phase2_priority_foods p, fodmap_subtypes fs
WHERE m.food_id = p.resolved_food_id
  AND m.fodmap_subtype_id = fs.fodmap_subtype_id
  AND p.priority_rank = 3
  AND m.source_id IN (
    SELECT source_id
    FROM sources
    WHERE source_slug = 'internal_rules_v1'
  )
  AND m.notes LIKE 'composition_zero_batch01_v1:%';

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
  format('composition_zero_batch01_v1:%s:%s', s.priority_rank, s.subtype_code),
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
WHERE notes LIKE 'composition_zero_batch01_v1:%';

COMMIT;
