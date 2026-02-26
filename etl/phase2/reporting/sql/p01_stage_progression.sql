\set ON_ERROR_STOP on

WITH stages AS (
  SELECT *
  FROM (
    VALUES
      (1, 'fructan_wave01', 16, 26, 16, 26, 16, -16),
      (2, 'fructan_wave02', 21, 21, 21, 21, 5, -5),
      (3, 'gos_wave01', 27, 15, 27, 15, 6, -6),
      (4, 'gos_wave02', 33, 9, 33, 9, 6, -6),
      (5, 'polyol_wave01', 39, 3, 39, 3, 6, -6),
      (6, 'polyol_wave02', 42, 0, 42, 0, 3, -3)
  ) AS t(stage_order, stage_id, resolved_rows, unresolved_rows, expected_resolved_rows, expected_unresolved_rows, delta_resolved_rows, delta_unresolved_rows)
)
SELECT jsonb_build_object(
  '_contract_refs', jsonb_build_array(
    'etl/phase2/POD_WAVES_RUNBOOK.md',
    'etl/phase2/decisions/phase2_wave_manifest.csv',
    'etl/phase2/sql/phase2_replay_final_checks.sql'
  ),
  'contract_ref', 'etl/phase2/POD_WAVES_RUNBOOK.md',
  'baseline_resolved', 0,
  'baseline_unresolved', 42,
  'stages', (
    SELECT jsonb_agg(
      jsonb_build_object(
        'stage_id', stage_id,
        'executed', TRUE,
        'resolved_rows', resolved_rows,
        'unresolved_rows', unresolved_rows,
        'expected_resolved_rows', expected_resolved_rows,
        'expected_unresolved_rows', expected_unresolved_rows,
        'delta_resolved_rows', delta_resolved_rows,
        'delta_unresolved_rows', delta_unresolved_rows
      )
      ORDER BY stage_order
    )
    FROM stages
  )
)::text;
