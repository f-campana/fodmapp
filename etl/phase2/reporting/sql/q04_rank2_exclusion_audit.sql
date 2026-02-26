\set ON_ERROR_STOP on

WITH
rank2_food AS (
  SELECT resolved_food_id AS food_id
  FROM phase2_priority_foods
  WHERE priority_rank = 2
),
api_active_rules AS (
  SELECT
    r.swap_rule_id,
    r.from_food_id,
    r.to_food_id
  FROM swap_rules r
  JOIN foods f_from ON f_from.food_id = r.from_food_id
  JOIN foods f_to ON f_to.food_id = r.to_food_id
  JOIN swap_rule_scores rs ON rs.swap_rule_id = r.swap_rule_id
  LEFT JOIN phase2_priority_foods p_from ON p_from.resolved_food_id = r.from_food_id
  LEFT JOIN phase2_priority_foods p_to ON p_to.resolved_food_id = r.to_food_id
  WHERE r.status = 'active'
    AND COALESCE(p_from.priority_rank, 0) <> 2
    AND COALESCE(p_to.priority_rank, 0) <> 2
    AND rs.fodmap_safety_score >= 0
),
calc AS (
  SELECT
    (
      SELECT COUNT(*)
      FROM phase2_priority_foods p
      JOIN fodmap_subtypes fst ON fst.code = p.target_subtype
      JOIN food_fodmap_measurements ffm
        ON ffm.food_id = p.resolved_food_id
       AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
      WHERE p.priority_rank = 2
        AND ffm.is_current = TRUE
    )::int AS phase2_rank2_current_target_measurements,
    (
      SELECT COUNT(*)
      FROM swap_rules r
      JOIN sources s ON s.source_id = r.source_id
      JOIN rank2_food rf ON (r.from_food_id = rf.food_id OR r.to_food_id = rf.food_id)
      WHERE s.source_slug = 'internal_rules_v1'
        AND r.notes = 'phase3_mvp_rule'
    )::int AS phase3_rules_touching_rank2,
    (
      SELECT COUNT(*)
      FROM api_active_rules ar
      JOIN rank2_food rf ON (ar.from_food_id = rf.food_id OR ar.to_food_id = rf.food_id)
    )::int AS api_rank2_leak_rows
),
checks AS (
  SELECT
    phase2_rank2_current_target_measurements,
    phase3_rules_touching_rank2,
    api_rank2_leak_rows,
    (
      phase2_rank2_current_target_measurements = 0
      AND phase3_rules_touching_rank2 = 0
      AND api_rank2_leak_rows = 0
    ) AS overall_pass
  FROM calc
)
SELECT jsonb_build_object(
  '_contract_refs', jsonb_build_array(
    'etl/phase2/sql/phase2_replay_final_checks.sql',
    'etl/phase2/sql/phase2_post_quarantine_checks.sql',
    'etl/phase3/sql/phase3_mvp_checks.sql',
    'api/app/sql.py',
    'api/tests/test_swaps.py'
  ),
  'phase2_rank2_current_target_measurements', phase2_rank2_current_target_measurements,
  'phase3_rules_touching_rank2', phase3_rules_touching_rank2,
  'api_rank2_leak_rows', api_rank2_leak_rows,
  'overall_pass', overall_pass
)::text
FROM checks;
