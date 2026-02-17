\set ON_ERROR_STOP on

BEGIN;

-- Phase 2.5 Wave 2 execution script (mutating, idempotent)
-- Scope lock: priority_rank IN (11,12,13,16,17)

DO $$
BEGIN
  IF to_regclass('public.v_phase2_resolution_candidates') IS NULL THEN
    RAISE EXCEPTION 'required view missing: v_phase2_resolution_candidates';
  END IF;
END $$;

CREATE TEMP TABLE wave_expected_ranks (
  priority_rank INTEGER PRIMARY KEY
) ON COMMIT DROP;

INSERT INTO wave_expected_ranks (priority_rank)
VALUES (11), (12), (13), (16), (17);

CREATE TEMP TABLE wave_non_scope_before ON COMMIT DROP AS
SELECT
  priority_rank,
  status,
  resolved_food_id,
  resolution_method,
  resolution_notes,
  resolved_at,
  resolved_by
FROM phase2_priority_foods
WHERE priority_rank NOT IN (SELECT priority_rank FROM wave_expected_ranks);

CREATE TEMP TABLE wave_pool_baseline ON COMMIT DROP AS
WITH unresolved AS (
  SELECT p.priority_rank
  FROM phase2_priority_foods AS p
  WHERE p.resolved_food_id IS NULL
),
flagged AS (
  SELECT
    u.priority_rank,
    EXISTS (
      SELECT 1
      FROM v_phase2_resolution_candidates AS c
      WHERE c.priority_rank = u.priority_rank
    ) AS has_candidate
  FROM unresolved AS u
)
SELECT
  COUNT(*) AS unresolved_total,
  COUNT(*) FILTER (WHERE has_candidate) AS with_candidates_total,
  COUNT(*) FILTER (WHERE NOT has_candidate) AS without_candidates_total,
  COUNT(*) FILTER (WHERE priority_rank IN (SELECT priority_rank FROM wave_expected_ranks)) AS wave_unresolved_total,
  COUNT(*) FILTER (WHERE priority_rank IN (SELECT priority_rank FROM wave_expected_ranks) AND has_candidate) AS wave_unresolved_with_candidates,
  COUNT(*) FILTER (WHERE priority_rank IN (SELECT priority_rank FROM wave_expected_ranks) AND NOT has_candidate) AS wave_unresolved_without_candidates
FROM flagged;

CREATE TEMP TABLE wave_decisions_stg (
  priority_rank INTEGER PRIMARY KEY,
  food_label TEXT,
  variant_label TEXT,
  decision TEXT,
  resolution_method TEXT,
  candidate_food_id TEXT,
  candidate_ciqual_code TEXT,
  new_food_slug TEXT,
  new_food_name_fr TEXT,
  new_food_name_en TEXT,
  new_food_preparation_state TEXT,
  resolution_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ
) ON COMMIT DROP;

CREATE TEMP TABLE wave_new_foods_stg (
  priority_rank INTEGER PRIMARY KEY,
  new_food_slug TEXT,
  new_food_name_fr TEXT,
  new_food_name_en TEXT,
  new_food_preparation_state TEXT,
  status TEXT,
  custom_ref_value TEXT,
  category_code TEXT,
  notes TEXT
) ON COMMIT DROP;

CREATE TEMP TABLE wave_measurements_stg (
  priority_rank INTEGER PRIMARY KEY,
  food_id TEXT,
  fodmap_subtype TEXT,
  amount_per_100g NUMERIC(12,6),
  comparator TEXT,
  serving_g NUMERIC(8,2),
  amount_per_serving NUMERIC(12,6),
  source_slug TEXT,
  citation_ref TEXT,
  evidence_tier TEXT,
  confidence_score NUMERIC(4,3),
  observed_at DATE,
  method TEXT,
  notes TEXT
) ON COMMIT DROP;

CREATE TEMP TABLE wave_thresholds_stg (
  priority_rank INTEGER PRIMARY KEY,
  food_id TEXT,
  fodmap_subtype TEXT,
  serving_g NUMERIC(8,2),
  low_max_g NUMERIC(12,6),
  moderate_max_g NUMERIC(12,6),
  source_slug TEXT,
  citation_ref TEXT,
  evidence_tier TEXT,
  confidence_score NUMERIC(4,3),
  valid_from DATE,
  notes TEXT
) ON COMMIT DROP;

\copy wave_decisions_stg (priority_rank,food_label,variant_label,decision,resolution_method,candidate_food_id,candidate_ciqual_code,new_food_slug,new_food_name_fr,new_food_name_en,new_food_preparation_state,resolution_notes,reviewed_by,reviewed_at) FROM '/Users/fabiencampana/Documents/Fodmap/etl/phase2/decisions/phase2_fructan_wave02_decisions.csv' WITH (FORMAT csv, HEADER true)
\copy wave_new_foods_stg (priority_rank,new_food_slug,new_food_name_fr,new_food_name_en,new_food_preparation_state,status,custom_ref_value,category_code,notes) FROM '/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_fructan_wave02_new_foods.csv' WITH (FORMAT csv, HEADER true)
\copy wave_measurements_stg (priority_rank,food_id,fodmap_subtype,amount_per_100g,comparator,serving_g,amount_per_serving,source_slug,citation_ref,evidence_tier,confidence_score,observed_at,method,notes) FROM '/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_fructan_wave02_measurements.csv' WITH (FORMAT csv, HEADER true)
\copy wave_thresholds_stg (priority_rank,food_id,fodmap_subtype,serving_g,low_max_g,moderate_max_g,source_slug,citation_ref,evidence_tier,confidence_score,valid_from,notes) FROM '/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_fructan_wave02_thresholds.csv' WITH (FORMAT csv, HEADER true)

DO $$
DECLARE
  expected_ranks INTEGER[] := ARRAY[11,12,13,16,17];
  got_ranks INTEGER[];
  bad_count INTEGER;
BEGIN
  SELECT array_agg(priority_rank ORDER BY priority_rank) INTO got_ranks FROM wave_decisions_stg;
  IF got_ranks IS DISTINCT FROM expected_ranks THEN
    RAISE EXCEPTION 'decisions rank set mismatch: expected %, got %', expected_ranks, got_ranks;
  END IF;

  SELECT array_agg(priority_rank ORDER BY priority_rank) INTO got_ranks FROM wave_new_foods_stg;
  IF got_ranks IS DISTINCT FROM expected_ranks THEN
    RAISE EXCEPTION 'new_foods rank set mismatch: expected %, got %', expected_ranks, got_ranks;
  END IF;

  SELECT array_agg(priority_rank ORDER BY priority_rank) INTO got_ranks FROM wave_measurements_stg;
  IF got_ranks IS DISTINCT FROM expected_ranks THEN
    RAISE EXCEPTION 'measurements rank set mismatch: expected %, got %', expected_ranks, got_ranks;
  END IF;

  SELECT array_agg(priority_rank ORDER BY priority_rank) INTO got_ranks FROM wave_thresholds_stg;
  IF got_ranks IS DISTINCT FROM expected_ranks THEN
    RAISE EXCEPTION 'thresholds rank set mismatch: expected %, got %', expected_ranks, got_ranks;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM wave_decisions_stg
  WHERE decision <> 'create_new_food'
     OR resolution_method <> 'new_food';

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'decision policy violation: expected create_new_food/new_food for all rows';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM wave_new_foods_stg
  WHERE new_food_slug IS NULL
     OR new_food_slug = ''
     OR new_food_slug NOT LIKE 'phase2-%'
     OR new_food_name_fr IS NULL
     OR new_food_name_fr = ''
     OR status <> 'draft'
     OR custom_ref_value <> ('phase2_pass3:' || priority_rank::TEXT)
     OR category_code IS NULL
     OR category_code = ''
     OR new_food_preparation_state NOT IN ('raw','cooked','processed','fermented','rehydrated','unknown');

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'new food scaffold validation failed';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM wave_new_foods_stg AS nf
  LEFT JOIN food_categories AS fc
    ON fc.code = nf.category_code
  WHERE fc.category_id IS NULL;

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'unknown category_code in new foods';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM wave_measurements_stg
  WHERE fodmap_subtype <> 'fructan'
     OR comparator NOT IN ('eq','lt','lte')
     OR method NOT IN ('lab','literature','derived_from_nutrient','expert_estimate','user_report')
     OR evidence_tier NOT IN ('primary_lab','secondary_db','inferred')
     OR source_slug IS NULL
     OR source_slug = ''
     OR citation_ref IS NULL
     OR citation_ref = '';

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'measurement policy validation failed';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM wave_measurements_stg
  WHERE ABS(amount_per_serving - ((amount_per_100g * serving_g) / 100.0)) > 0.000001;

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'measurement arithmetic validation failed: amount_per_serving mismatch';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM wave_thresholds_stg
  WHERE fodmap_subtype <> 'fructan'
     OR source_slug <> 'monash_app_v4_reference'
     OR low_max_g IS NULL
     OR moderate_max_g IS NULL
     OR low_max_g > moderate_max_g
     OR valid_from IS NULL
     OR citation_ref IS NULL
     OR citation_ref = '';

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'threshold policy validation failed';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT DISTINCT source_slug FROM wave_measurements_stg
    UNION
    SELECT DISTINCT source_slug FROM wave_thresholds_stg
  ) AS ss
  LEFT JOIN sources AS s
    ON s.source_slug = ss.source_slug
  WHERE s.source_id IS NULL;

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'unknown source_slug in wave staging files';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM wave_measurements_stg
  WHERE NULLIF(food_id, '') IS NOT NULL;

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'measurement food_id must be empty for wave02 create_new_food flow';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM wave_thresholds_stg
  WHERE NULLIF(food_id, '') IS NOT NULL;

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'threshold food_id must be empty for wave02 create_new_food flow';
  END IF;
END $$;

WITH measurement_defaults AS (
  SELECT priority_rank, serving_g
  FROM wave_measurements_stg
),
missing_foods AS (
  SELECT nf.*, md.serving_g
  FROM wave_new_foods_stg AS nf
  LEFT JOIN foods AS f
    ON f.food_slug = nf.new_food_slug
  LEFT JOIN measurement_defaults AS md
    ON md.priority_rank = nf.priority_rank
  WHERE f.food_id IS NULL
)
INSERT INTO foods (
  food_slug,
  canonical_name_fr,
  canonical_name_en,
  preparation_state,
  default_serving_g,
  status
)
SELECT
  mf.new_food_slug,
  mf.new_food_name_fr,
  NULLIF(mf.new_food_name_en, ''),
  mf.new_food_preparation_state::preparation_state,
  mf.serving_g,
  mf.status
FROM missing_foods AS mf;

WITH internal_source AS (
  SELECT source_id
  FROM sources
  WHERE source_slug = 'internal_rules_v1'
)
INSERT INTO food_external_refs (
  food_id,
  ref_system,
  ref_value,
  source_id,
  country_code
)
SELECT
  f.food_id,
  'CUSTOM',
  nf.custom_ref_value,
  s.source_id,
  'FR'
FROM wave_new_foods_stg AS nf
JOIN foods AS f
  ON f.food_slug = nf.new_food_slug
CROSS JOIN internal_source AS s
ON CONFLICT (food_id, ref_system, ref_value) DO NOTHING;

WITH internal_source AS (
  SELECT source_id
  FROM sources
  WHERE source_slug = 'internal_rules_v1'
)
INSERT INTO food_names (food_id, locale_code, name, is_primary, source_id)
SELECT
  f.food_id,
  'fr-FR',
  nf.new_food_name_fr,
  TRUE,
  s.source_id
FROM wave_new_foods_stg AS nf
JOIN foods AS f
  ON f.food_slug = nf.new_food_slug
CROSS JOIN internal_source AS s
ON CONFLICT (food_id, locale_code, name) DO NOTHING;

WITH internal_source AS (
  SELECT source_id
  FROM sources
  WHERE source_slug = 'internal_rules_v1'
)
INSERT INTO food_names (food_id, locale_code, name, is_primary, source_id)
SELECT
  f.food_id,
  'en-GB',
  nf.new_food_name_en,
  TRUE,
  s.source_id
FROM wave_new_foods_stg AS nf
JOIN foods AS f
  ON f.food_slug = nf.new_food_slug
CROSS JOIN internal_source AS s
WHERE NULLIF(nf.new_food_name_en, '') IS NOT NULL
ON CONFLICT (food_id, locale_code, name) DO NOTHING;

WITH internal_source AS (
  SELECT source_id
  FROM sources
  WHERE source_slug = 'internal_rules_v1'
),
category_map AS (
  SELECT
    nf.priority_rank,
    f.food_id,
    fc.category_id,
    s.source_id
  FROM wave_new_foods_stg AS nf
  JOIN foods AS f
    ON f.food_slug = nf.new_food_slug
  JOIN food_categories AS fc
    ON fc.code = nf.category_code
  CROSS JOIN internal_source AS s
)
INSERT INTO food_category_memberships (food_id, category_id, source_id, is_primary)
SELECT
  cm.food_id,
  cm.category_id,
  cm.source_id,
  TRUE
FROM category_map AS cm
ON CONFLICT (food_id, category_id, source_id) DO NOTHING;

UPDATE phase2_priority_foods AS p
SET
  resolved_food_id = f.food_id,
  resolution_method = 'new_food',
  resolution_notes = d.resolution_notes,
  status = CASE WHEN p.status = 'pending_research' THEN 'resolved' ELSE p.status END,
  resolved_at = COALESCE(p.resolved_at, d.reviewed_at, now()),
  resolved_by = COALESCE(NULLIF(d.reviewed_by, ''), 'wave02_apply'),
  updated_at = now()
FROM wave_decisions_stg AS d
JOIN wave_new_foods_stg AS nf
  ON nf.priority_rank = d.priority_rank
JOIN foods AS f
  ON f.food_slug = nf.new_food_slug
WHERE p.priority_rank = d.priority_rank
  AND (
    p.resolved_food_id IS DISTINCT FROM f.food_id
    OR p.resolution_method IS DISTINCT FROM 'new_food'
    OR p.resolution_notes IS DISTINCT FROM d.resolution_notes
    OR p.resolved_by IS DISTINCT FROM COALESCE(NULLIF(d.reviewed_by, ''), 'wave02_apply')
    OR p.status IS DISTINCT FROM CASE WHEN p.status = 'pending_research' THEN 'resolved' ELSE p.status END
  );

CREATE TEMP TABLE wave_measurements_resolved ON COMMIT DROP AS
SELECT
  m.priority_rank,
  p.resolved_food_id AS food_id,
  m.fodmap_subtype,
  m.amount_per_100g,
  m.comparator,
  m.serving_g,
  m.amount_per_serving,
  m.source_slug,
  m.citation_ref,
  m.evidence_tier,
  m.confidence_score,
  m.observed_at,
  m.method,
  m.notes
FROM wave_measurements_stg AS m
JOIN phase2_priority_foods AS p
  ON p.priority_rank = m.priority_rank;

CREATE TEMP TABLE wave_thresholds_resolved ON COMMIT DROP AS
SELECT
  t.priority_rank,
  p.resolved_food_id AS food_id,
  t.fodmap_subtype,
  t.serving_g,
  t.low_max_g,
  t.moderate_max_g,
  t.source_slug,
  t.citation_ref,
  t.evidence_tier,
  t.confidence_score,
  t.valid_from,
  t.notes
FROM wave_thresholds_stg AS t
JOIN phase2_priority_foods AS p
  ON p.priority_rank = t.priority_rank;

DO $$
DECLARE
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count
  FROM wave_measurements_resolved
  WHERE food_id IS NULL;

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'measurement resolution failed: unresolved food_id rows remain';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM wave_thresholds_resolved
  WHERE food_id IS NULL;

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'threshold resolution failed: unresolved food_id rows remain';
  END IF;
END $$;

WITH prepared AS (
  SELECT
    wr.food_id,
    fst.fodmap_subtype_id,
    s.source_id,
    wr.citation_ref,
    CASE
      WHEN wr.comparator = 'lt' THEN '< ' || wr.amount_per_100g::TEXT
      WHEN wr.comparator = 'lte' THEN '<= ' || wr.amount_per_100g::TEXT
      ELSE wr.amount_per_100g::TEXT
    END AS amount_raw,
    wr.comparator::comparator_code AS comparator,
    wr.amount_per_100g,
    wr.amount_per_serving,
    wr.serving_g,
    wr.method,
    wr.evidence_tier::evidence_tier AS evidence_tier,
    wr.confidence_score,
    wr.observed_at,
    wr.notes
  FROM wave_measurements_resolved AS wr
  JOIN sources AS s
    ON s.source_slug = wr.source_slug
  JOIN fodmap_subtypes AS fst
    ON fst.code = wr.fodmap_subtype
)
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
  p.food_id,
  p.fodmap_subtype_id,
  p.source_id,
  p.citation_ref,
  p.amount_raw,
  p.comparator,
  p.amount_per_100g,
  p.amount_per_serving,
  p.serving_g,
  p.method,
  p.evidence_tier,
  p.confidence_score,
  p.observed_at,
  TRUE,
  p.notes
FROM prepared AS p
WHERE NOT EXISTS (
  SELECT 1
  FROM food_fodmap_measurements AS ffm
  WHERE ffm.food_id = p.food_id
    AND ffm.fodmap_subtype_id = p.fodmap_subtype_id
    AND ffm.source_id = p.source_id
    AND ffm.source_record_ref IS NOT DISTINCT FROM p.citation_ref
    AND ffm.amount_raw = p.amount_raw
    AND ffm.comparator = p.comparator
    AND ffm.observed_at IS NOT DISTINCT FROM p.observed_at
);

INSERT INTO food_fodmap_thresholds (
  food_id,
  fodmap_subtype_id,
  source_id,
  serving_g,
  low_max_g,
  moderate_max_g,
  evidence_tier,
  confidence_score,
  valid_from,
  notes
)
SELECT
  tr.food_id,
  fst.fodmap_subtype_id,
  s.source_id,
  tr.serving_g,
  tr.low_max_g,
  tr.moderate_max_g,
  tr.evidence_tier::evidence_tier,
  tr.confidence_score,
  tr.valid_from,
  tr.notes
FROM wave_thresholds_resolved AS tr
JOIN fodmap_subtypes AS fst
  ON fst.code = tr.fodmap_subtype
JOIN sources AS s
  ON s.source_slug = tr.source_slug
ON CONFLICT (food_id, fodmap_subtype_id, source_id, serving_g, valid_from)
DO UPDATE SET
  low_max_g = EXCLUDED.low_max_g,
  moderate_max_g = EXCLUDED.moderate_max_g,
  evidence_tier = EXCLUDED.evidence_tier,
  confidence_score = EXCLUDED.confidence_score,
  notes = EXCLUDED.notes,
  valid_to = NULL;

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
),
monash_source AS (
  SELECT source_id
  FROM sources
  WHERE source_slug = 'monash_app_v4_reference'
),
status_eval AS (
  SELECT
    p.priority_rank,
    p.status AS current_status,
    EXISTS (
      SELECT 1
      FROM food_fodmap_measurements AS ffm
      JOIN fodmap_subtypes AS fst
        ON fst.fodmap_subtype_id = ffm.fodmap_subtype_id
      WHERE ffm.food_id = p.resolved_food_id
        AND fst.code = p.target_subtype
        AND ffm.source_id IN (SELECT source_id FROM phase2_sources)
        AND ffm.is_current = TRUE
    ) AS has_current_measurement,
    EXISTS (
      SELECT 1
      FROM food_fodmap_thresholds AS fft
      JOIN fodmap_subtypes AS fst
        ON fst.fodmap_subtype_id = fft.fodmap_subtype_id
      WHERE fft.food_id = p.resolved_food_id
        AND fst.code = p.target_subtype
        AND fft.source_id IN (SELECT source_id FROM monash_source)
    ) AS has_threshold
  FROM phase2_priority_foods AS p
  WHERE p.priority_rank IN (SELECT priority_rank FROM wave_expected_ranks)
),
resolved_status AS (
  SELECT
    priority_rank,
    CASE
      WHEN has_current_measurement AND has_threshold THEN 'threshold_set'
      WHEN has_current_measurement THEN 'measured'
      ELSE 'resolved'
    END AS next_status
  FROM status_eval
)
UPDATE phase2_priority_foods AS p
SET
  status = r.next_status,
  updated_at = now()
FROM resolved_status AS r
WHERE p.priority_rank = r.priority_rank
  AND p.status IS DISTINCT FROM r.next_status;

DO $$
DECLARE
  bad_count INTEGER;
  v_unresolved_after INTEGER;
  v_with_candidates_after INTEGER;
  v_without_candidates_after INTEGER;
  v_expected_unresolved INTEGER;
  v_expected_with_candidates INTEGER;
  v_expected_without_candidates INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count
  FROM wave_non_scope_before AS b
  JOIN phase2_priority_foods AS p
    ON p.priority_rank = b.priority_rank
  WHERE b.status IS DISTINCT FROM p.status
     OR b.resolved_food_id IS DISTINCT FROM p.resolved_food_id
     OR b.resolution_method IS DISTINCT FROM p.resolution_method
     OR b.resolution_notes IS DISTINCT FROM p.resolution_notes
     OR b.resolved_at IS DISTINCT FROM p.resolved_at
     OR b.resolved_by IS DISTINCT FROM p.resolved_by;

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'scope lock violated: non-wave rows changed (%)', bad_count;
  END IF;

  WITH unresolved AS (
    SELECT p.priority_rank
    FROM phase2_priority_foods AS p
    WHERE p.resolved_food_id IS NULL
  ),
  flagged AS (
    SELECT
      u.priority_rank,
      EXISTS (
        SELECT 1
        FROM v_phase2_resolution_candidates AS c
        WHERE c.priority_rank = u.priority_rank
      ) AS has_candidate
    FROM unresolved AS u
  )
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE has_candidate),
    COUNT(*) FILTER (WHERE NOT has_candidate)
  INTO v_unresolved_after, v_with_candidates_after, v_without_candidates_after
  FROM flagged;

  SELECT
    unresolved_total - wave_unresolved_total,
    with_candidates_total - wave_unresolved_with_candidates,
    without_candidates_total - wave_unresolved_without_candidates
  INTO v_expected_unresolved, v_expected_with_candidates, v_expected_without_candidates
  FROM wave_pool_baseline;

  IF v_unresolved_after <> v_expected_unresolved THEN
    RAISE EXCEPTION 'unresolved delta mismatch: expected %, got %', v_expected_unresolved, v_unresolved_after;
  END IF;

  IF v_with_candidates_after <> v_expected_with_candidates THEN
    RAISE EXCEPTION 'with-candidates delta mismatch: expected %, got %', v_expected_with_candidates, v_with_candidates_after;
  END IF;

  IF v_without_candidates_after <> v_expected_without_candidates THEN
    RAISE EXCEPTION 'without-candidates delta mismatch: expected %, got %', v_expected_without_candidates, v_without_candidates_after;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM phase2_priority_foods
  WHERE priority_rank IN (SELECT priority_rank FROM wave_expected_ranks)
    AND status <> 'threshold_set';

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'wave status gate failed: not all wave rows are threshold_set';
  END IF;
END $$;

SELECT
  'fructan_wave02_apply_summary' AS summary,
  (SELECT unresolved_total FROM wave_pool_baseline) AS baseline_unresolved,
  (SELECT with_candidates_total FROM wave_pool_baseline) AS baseline_with_candidates,
  (SELECT without_candidates_total FROM wave_pool_baseline) AS baseline_without_candidates,
  (SELECT COUNT(*) FROM phase2_priority_foods WHERE resolved_food_id IS NULL) AS post_unresolved,
  (
    WITH unresolved AS (
      SELECT p.priority_rank
      FROM phase2_priority_foods AS p
      WHERE p.resolved_food_id IS NULL
    )
    SELECT COUNT(*)
    FROM unresolved AS u
    WHERE EXISTS (
      SELECT 1
      FROM v_phase2_resolution_candidates AS c
      WHERE c.priority_rank = u.priority_rank
    )
  ) AS post_with_candidates,
  (
    WITH unresolved AS (
      SELECT p.priority_rank
      FROM phase2_priority_foods AS p
      WHERE p.resolved_food_id IS NULL
    )
    SELECT COUNT(*)
    FROM unresolved AS u
    WHERE NOT EXISTS (
      SELECT 1
      FROM v_phase2_resolution_candidates AS c
      WHERE c.priority_rank = u.priority_rank
    )
  ) AS post_without_candidates;

COMMIT;
