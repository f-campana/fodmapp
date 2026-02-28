\set ON_ERROR_STOP on

WITH stages AS (
  SELECT
    stage_order,
    stage_id,
    with_candidates_rows,
    without_candidates_rows,
    unresolved_rows,
    CASE
      WHEN unresolved_rows = 0 THEN 1.0000::numeric
      ELSE ROUND((with_candidates_rows::numeric / unresolved_rows::numeric), 4)
    END AS pool_closure_rate
  FROM reporting_stage_contract_snapshot
)
SELECT jsonb_build_object(
  '_contract_refs', jsonb_build_array(
    'etl/phase2/sql/phase2_fructan_wave01_checks.sql',
    'etl/phase2/sql/phase2_fructan_wave02_checks.sql',
    'etl/phase2/sql/phase2_gos_wave01_checks.sql',
    'etl/phase2/sql/phase2_gos_wave02_checks.sql',
    'etl/phase2/sql/phase2_polyol_wave01_checks.sql',
    'etl/phase2/sql/phase2_polyol_wave02_checks.sql'
  ),
  'stages', (
    SELECT jsonb_agg(
      jsonb_build_object(
        'stage_id', stage_id,
        'with_candidates_rows', with_candidates_rows,
        'without_candidates_rows', without_candidates_rows,
        'pool_closure_rate', pool_closure_rate,
        'unresolved_rows', unresolved_rows
      )
      ORDER BY stage_order
    )
    FROM stages
  ),
  'total_with_candidates', (SELECT SUM(with_candidates_rows) FROM stages),
  'total_without_candidates', (SELECT SUM(without_candidates_rows) FROM stages)
)::text;
