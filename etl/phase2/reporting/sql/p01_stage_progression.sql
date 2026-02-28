\set ON_ERROR_STOP on

WITH baseline AS (
  SELECT MAX((resolved_rows + unresolved_rows))::int AS total_rows
  FROM reporting_stage_contract_snapshot
),
stages AS (
  SELECT
    s.stage_order,
    s.stage_id,
    s.resolved_rows,
    s.unresolved_rows,
    s.resolved_rows AS expected_resolved_rows,
    s.unresolved_rows AS expected_unresolved_rows,
    s.resolved_rows - COALESCE(
      LAG(s.resolved_rows) OVER (ORDER BY s.stage_order),
      0
    ) AS delta_resolved_rows,
    s.unresolved_rows - COALESCE(
      LAG(s.unresolved_rows) OVER (ORDER BY s.stage_order),
      (SELECT total_rows FROM baseline)
    ) AS delta_unresolved_rows
  FROM reporting_stage_contract_snapshot s
)
SELECT jsonb_build_object(
  '_contract_refs', jsonb_build_array(
    'etl/phase2/POD_WAVES_RUNBOOK.md',
    'etl/phase2/decisions/phase2_wave_manifest.csv',
    'etl/phase2/sql/phase2_replay_final_checks.sql'
  ),
  'contract_ref', 'etl/phase2/POD_WAVES_RUNBOOK.md',
  'baseline_resolved', 0,
  'baseline_unresolved', (SELECT COALESCE(total_rows, 0) FROM baseline),
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
