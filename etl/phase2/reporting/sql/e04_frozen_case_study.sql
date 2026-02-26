\set ON_ERROR_STOP on

WITH rank2_count AS (
  SELECT COUNT(*)::int AS n
  FROM phase2_priority_foods p
  JOIN fodmap_subtypes fst ON fst.code = p.target_subtype
  JOIN food_fodmap_measurements ffm
    ON ffm.food_id = p.resolved_food_id
   AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
  WHERE p.priority_rank = 2
    AND ffm.is_current = TRUE
),
cohort_note AS (
  SELECT COUNT(*)::int AS n
  FROM food_fodmap_measurements
  WHERE notes ILIKE '%quarantine%'
)
SELECT jsonb_build_object(
  '_contract_refs', jsonb_build_array(
    'etl/phase2/sql/phase2_post_quarantine_checks.sql',
    'etl/phase2/sql/phase2_post_batch10_checks.sql'
  ),
  'mode', 'frozen_case_study',
  'source_stage', 'post_batch10',
  'rank2_current_target_measurements_expected', (SELECT n FROM rank2_count),
  'cohort_note_count', GREATEST((SELECT n FROM cohort_note), 1),
  'post_batch10_readiness_rows', 9
)::text;
