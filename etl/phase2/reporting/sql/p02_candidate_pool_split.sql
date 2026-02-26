\set ON_ERROR_STOP on

WITH stages AS (
  SELECT *
  FROM (
    VALUES
      (1, 'fructan_wave01', 16, 10, 26, 0.6154::numeric),
      (2, 'fructan_wave02', 15, 6, 21, 0.7143::numeric),
      (3, 'gos_wave01', 9, 6, 15, 0.6000::numeric),
      (4, 'gos_wave02', 6, 3, 9, 0.6667::numeric),
      (5, 'polyol_wave01', 1, 2, 3, 0.3333::numeric),
      (6, 'polyol_wave02', 0, 0, 0, 1.0000::numeric)
  ) AS t(stage_order, stage_id, with_candidates_rows, without_candidates_rows, unresolved_rows, pool_closure_rate)
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
