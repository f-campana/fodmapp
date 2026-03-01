\set ON_ERROR_STOP on

WITH rows_src AS (
  SELECT
    CASE
      WHEN gap_bucket = 'fructan_dominant' AND target_subtype = 'fructan' THEN 1
      WHEN gap_bucket = 'gos_dominant' AND target_subtype = 'gos' THEN 2
      WHEN gap_bucket = 'polyol_split_needed' AND target_subtype = 'sorbitol' THEN 3
      WHEN gap_bucket = 'polyol_split_needed' AND target_subtype = 'mannitol' THEN 4
      ELSE 99
    END AS row_order,
    CASE
      WHEN gap_bucket = 'fructan_dominant' AND target_subtype = 'fructan' THEN 'fructan/fructan'
      WHEN gap_bucket = 'gos_dominant' AND target_subtype = 'gos' THEN 'gos/gos'
      WHEN gap_bucket = 'polyol_split_needed' AND target_subtype = 'sorbitol' THEN 'polyol/sorbitol'
      WHEN gap_bucket = 'polyol_split_needed' AND target_subtype = 'mannitol' THEN 'polyol/mannitol'
      ELSE gap_bucket || '/' || target_subtype
    END AS bucket,
    priority_rows,
    resolved_rows,
    completed_rows,
    unresolved_rows,
    pending_measurement_rows,
    completion_ratio,
    (resolved_rows - completed_rows) AS readiness_gap
  FROM v_phase2_gap_completion
  WHERE (gap_bucket = 'fructan_dominant' AND target_subtype = 'fructan')
     OR (gap_bucket = 'gos_dominant' AND target_subtype = 'gos')
     OR (gap_bucket = 'polyol_split_needed' AND target_subtype IN ('sorbitol', 'mannitol'))
)
SELECT jsonb_build_object(
  '_contract_refs', jsonb_build_array(
    'etl/phase2/sql/phase2_scaffold_views.sql',
    'etl/phase2/sql/phase2_replay_final_checks.sql',
    'etl/phase2/sql/phase2_post_batch10_checks.sql'
  ),
  'bucket_rows', (
    SELECT jsonb_agg(
      jsonb_build_object(
        'bucket', bucket,
        'priority_rows', priority_rows,
        'resolved_rows', resolved_rows,
        'completed_rows', completed_rows,
        'unresolved_rows', unresolved_rows,
        'pending_measurement_rows', pending_measurement_rows,
        'completion_ratio', completion_ratio,
        'readiness_gap', readiness_gap
      ) ORDER BY row_order
    )
    FROM rows_src
  ),
  'completion_ratio', (
    SELECT ROUND((SUM(completed_rows)::numeric / NULLIF(SUM(priority_rows), 0)), 3)
    FROM rows_src
  ),
  'readiness_gap', (
    SELECT COALESCE(SUM(readiness_gap), 0)
    FROM rows_src
  )
)::text;
