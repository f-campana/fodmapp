\set ON_ERROR_STOP on

-- Proposal-only draft apply script for gos_wave02.
-- Scope lock: priority_rank IN (24,25,26,27,28,29)
-- Inputs:
-- - /Users/fabiencampana/Documents/Fodmap/etl/phase2/decisions/phase2_gos_wave02_decisions.csv
-- - /Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_gos_wave02_measurements.csv
-- - /Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_gos_wave02_thresholds.csv
-- - /Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_gos_wave02_new_foods.csv (optional for create_new_food rows)

CREATE TEMP TABLE wave_decisions_stg (
  priority_rank INTEGER PRIMARY KEY,
  food_label TEXT,
  variant_label TEXT,
  decision TEXT,
  resolution_method TEXT,
  candidate_food_id UUID,
  candidate_ciqual_code TEXT,
  new_food_slug TEXT,
  new_food_name_fr TEXT,
  new_food_name_en TEXT,
  new_food_preparation_state TEXT,
  resolution_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ
);

\copy wave_decisions_stg (priority_rank,food_label,variant_label,decision,resolution_method,candidate_food_id,candidate_ciqual_code,new_food_slug,new_food_name_fr,new_food_name_en,new_food_preparation_state,resolution_notes,reviewed_by,reviewed_at) FROM '/Users/fabiencampana/Documents/Fodmap/etl/phase2/decisions/phase2_gos_wave02_decisions.csv' WITH (FORMAT csv, HEADER true)

SELECT 'gos_wave02' AS wave_key,
       COUNT(*) AS rows_in_wave,
       COUNT(*) FILTER (WHERE decision IS NULL OR trim(decision) = '') AS missing_decisions,
       COUNT(*) FILTER (WHERE decision = 'resolve_existing') AS resolve_existing_rows,
       COUNT(*) FILTER (WHERE decision = 'create_new_food') AS create_new_food_rows,
       COUNT(*) FILTER (WHERE decision = 'blocked') AS blocked_rows
FROM wave_decisions_stg;

SELECT
  priority_rank,
  decision,
  resolution_method,
  candidate_food_id,
  new_food_slug,
  new_food_name_fr,
  new_food_name_en,
  new_food_preparation_state,
  resolution_notes
FROM wave_decisions_stg
ORDER BY priority_rank;

-- TODO (after review approval):
-- 1) apply resolve_existing links to phase2_priority_foods
-- 2) create new foods + refs + names for create_new_food rows
-- 3) ingest measurements and thresholds from wave data CSVs
-- 4) run corresponding checks script
