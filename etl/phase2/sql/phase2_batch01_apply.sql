\set ON_ERROR_STOP on

BEGIN;

-- Phase 2 batch01 replay apply (idempotent, CIQUAL-code-led).
-- Scope lock: priority_rank IN (2,4,5,14,15,34,39,40,41)

CREATE TEMP TABLE batch01_expected_ranks (
  priority_rank INTEGER PRIMARY KEY
) ON COMMIT DROP;

INSERT INTO batch01_expected_ranks (priority_rank)
VALUES (2), (4), (5), (14), (15), (34), (39), (40), (41);

CREATE TEMP TABLE batch01_non_scope_before ON COMMIT DROP AS
SELECT
  priority_rank,
  status,
  resolved_food_id,
  resolution_method,
  resolution_notes,
  resolved_at,
  resolved_by
FROM phase2_priority_foods
WHERE priority_rank NOT IN (SELECT priority_rank FROM batch01_expected_ranks);

CREATE TEMP TABLE batch01_decisions_stg (
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

\copy batch01_decisions_stg (priority_rank,food_label,variant_label,decision,resolution_method,candidate_food_id,candidate_ciqual_code,new_food_slug,new_food_name_fr,new_food_name_en,new_food_preparation_state,resolution_notes,reviewed_by,reviewed_at) FROM '/Users/fabiencampana/Documents/Fodmap/etl/phase2/decisions/phase2_batch01_decisions.csv' WITH (FORMAT csv, HEADER true)

DO $$
DECLARE
  expected_ranks INTEGER[] := ARRAY[2,4,5,14,15,34,39,40,41];
  got_ranks INTEGER[];
  bad_count INTEGER;
BEGIN
  SELECT array_agg(priority_rank ORDER BY priority_rank)
  INTO got_ranks
  FROM batch01_decisions_stg;

  IF got_ranks IS DISTINCT FROM expected_ranks THEN
    RAISE EXCEPTION 'batch01 rank set mismatch: expected %, got %', expected_ranks, got_ranks;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM batch01_decisions_stg
  WHERE decision <> 'resolve_existing';

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'batch01 policy violation: all rows must be resolve_existing';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM batch01_decisions_stg
  WHERE COALESCE(NULLIF(resolution_method, ''), 'name_match') NOT IN ('name_match', 'slug_match', 'manual');

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'batch01 resolution_method policy violation';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM batch01_decisions_stg
  WHERE NULLIF(candidate_ciqual_code, '') IS NULL;

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'batch01 rows must include candidate_ciqual_code';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM batch01_decisions_stg
  WHERE (priority_rank = 2  AND candidate_ciqual_code <> '11023')
     OR (priority_rank = 4  AND candidate_ciqual_code <> '20034')
     OR (priority_rank = 5  AND candidate_ciqual_code <> '20035')
     OR (priority_rank = 14 AND candidate_ciqual_code <> '9390')
     OR (priority_rank = 15 AND candidate_ciqual_code <> '9322')
     OR (priority_rank = 34 AND candidate_ciqual_code <> '13149')
     OR (priority_rank = 39 AND candidate_ciqual_code <> '20114')
     OR (priority_rank = 40 AND candidate_ciqual_code <> '20017')
     OR (priority_rank = 41 AND candidate_ciqual_code <> '4102');

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'batch01 locked CIQUAL mapping mismatch';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM batch01_decisions_stg AS d
  WHERE (
    SELECT COUNT(DISTINCT fer.food_id)
    FROM food_external_refs AS fer
    WHERE fer.ref_system = 'CIQUAL'
      AND fer.ref_value = d.candidate_ciqual_code
  ) <> 1;

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'batch01 resolve rows must map to exactly one CIQUAL food_id';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM batch01_decisions_stg AS d
  LEFT JOIN phase2_priority_foods AS p
    ON p.priority_rank = d.priority_rank
  WHERE p.priority_rank IS NULL;

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'batch01 decisions include unknown priority_rank';
  END IF;
END $$;

UPDATE phase2_priority_foods AS p
SET
  resolved_food_id = fer.food_id,
  resolution_method = COALESCE(NULLIF(d.resolution_method, ''), 'name_match'),
  resolution_notes = COALESCE(
    NULLIF(d.resolution_notes, ''),
    'Resolved by Batch01 approved CIQUAL mapping'
  ),
  status = CASE WHEN p.status = 'pending_research' THEN 'resolved' ELSE p.status END,
  resolved_at = COALESCE(p.resolved_at, COALESCE(d.reviewed_at, now())),
  resolved_by = COALESCE(NULLIF(d.reviewed_by, ''), 'batch01_apply'),
  updated_at = now()
FROM batch01_decisions_stg AS d
JOIN LATERAL (
  SELECT fer.food_id
  FROM food_external_refs AS fer
  WHERE fer.ref_system = 'CIQUAL'
    AND fer.ref_value = d.candidate_ciqual_code
  ORDER BY fer.food_id
  LIMIT 1
) AS fer ON TRUE
WHERE p.priority_rank = d.priority_rank
  AND (
    p.resolved_food_id IS DISTINCT FROM fer.food_id
    OR p.resolution_method IS DISTINCT FROM COALESCE(NULLIF(d.resolution_method, ''), 'name_match')
    OR p.resolution_notes IS DISTINCT FROM COALESCE(
      NULLIF(d.resolution_notes, ''),
      'Resolved by Batch01 approved CIQUAL mapping'
    )
    OR p.resolved_by IS DISTINCT FROM COALESCE(NULLIF(d.reviewed_by, ''), 'batch01_apply')
    OR p.status = 'pending_research'
  );

DO $$
DECLARE
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count
  FROM phase2_priority_foods AS p
  JOIN batch01_non_scope_before AS b
    ON b.priority_rank = p.priority_rank
  WHERE p.status IS DISTINCT FROM b.status
     OR p.resolved_food_id IS DISTINCT FROM b.resolved_food_id
     OR p.resolution_method IS DISTINCT FROM b.resolution_method
     OR p.resolution_notes IS DISTINCT FROM b.resolution_notes
     OR p.resolved_at IS DISTINCT FROM b.resolved_at
     OR p.resolved_by IS DISTINCT FROM b.resolved_by;

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'scope lock failed: non-batch01 rows were mutated';
  END IF;
END $$;

SELECT
  COUNT(*) AS batch01_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL) AS batch01_resolved_rows,
  COUNT(*) FILTER (WHERE status = 'resolved') AS batch01_resolved_status_rows
FROM phase2_priority_foods
WHERE priority_rank IN (SELECT priority_rank FROM batch01_expected_ranks);

SELECT
  COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL) AS resolved_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NULL) AS unresolved_rows
FROM phase2_priority_foods;

COMMIT;
