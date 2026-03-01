\set ON_ERROR_STOP on

WITH gap_tuples AS (
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
    unresolved_rows
  FROM v_phase2_gap_completion
  WHERE (gap_bucket = 'fructan_dominant' AND target_subtype = 'fructan')
     OR (gap_bucket = 'gos_dominant' AND target_subtype = 'gos')
     OR (gap_bucket = 'polyol_split_needed' AND target_subtype IN ('sorbitol', 'mannitol'))
),
phase2_tuple AS (
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL)::int AS resolved,
    COUNT(*) FILTER (WHERE resolved_food_id IS NULL)::int AS unresolved
  FROM phase2_priority_foods
),
rollup_count AS (
  SELECT COUNT(*)::int AS n FROM v_phase3_rollups_latest_full
),
swap_status AS (
  SELECT
    COUNT(*) FILTER (WHERE r.status = 'active')::int AS active,
    COUNT(*) FILTER (WHERE r.status = 'draft')::int AS draft
  FROM swap_rules r
  JOIN sources src ON src.source_id = r.source_id
  WHERE src.source_slug = 'internal_rules_v1'
    AND r.notes = 'phase3_mvp_rule'
)
SELECT jsonb_build_object(
  '_contract_refs', jsonb_build_array(
    'etl/phase2/sql/phase2_replay_final_checks.sql',
    'etl/phase3/sql/phase3_rollups_6subtype_checks.sql',
    'api/app/sql.py'
  ),
  'phase2_priority_tuple', (
    SELECT jsonb_build_object('total', total, 'resolved', resolved, 'unresolved', unresolved)
    FROM phase2_tuple
  ),
  'phase2_gap_tuples', (
    SELECT jsonb_agg(
      jsonb_build_object(
        'bucket', bucket,
        'tuple', jsonb_build_object('total', priority_rows, 'resolved', resolved_rows, 'unresolved', unresolved_rows),
        'ok', (resolved_rows + unresolved_rows = priority_rows)
      )
      ORDER BY row_order
    )
    FROM gap_tuples
  ),
  'phase3_rollup_row_count', (SELECT n FROM rollup_count),
  'swap_status_tuple', (
    SELECT jsonb_build_object('active', active, 'draft', draft)
    FROM swap_status
  ),
  'contract_checks', (
    SELECT jsonb_build_object(
      'phase2_ok', (resolved = total),
      'phase3_ok', ((SELECT n FROM rollup_count) = total),
      'rank2_api_ok', (
        SELECT COUNT(*) = 0
        FROM swap_rules r
        JOIN sources src ON src.source_id = r.source_id
        JOIN phase2_priority_foods p_from ON p_from.resolved_food_id = r.from_food_id
        JOIN phase2_priority_foods p_to ON p_to.resolved_food_id = r.to_food_id
        WHERE src.source_slug = 'internal_rules_v1'
          AND r.notes = 'phase3_mvp_rule'
          AND (p_from.priority_rank = 2 OR p_to.priority_rank = 2)
      )
    )
    FROM phase2_tuple
  )
)::text;
