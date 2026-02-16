\set ON_ERROR_STOP on

-- Soft-quarantine rank 2 (garlic powder) suspect fructan measurement.
-- Keeps row for audit trail, marks non-current, and appends quarantine note token once.

BEGIN;

WITH rank2_target AS (
  SELECT
    p.priority_rank,
    p.resolved_food_id AS food_id,
    fst.fodmap_subtype_id
  FROM phase2_priority_foods AS p
  JOIN fodmap_subtypes AS fst
    ON fst.code = 'fructan'
  WHERE p.priority_rank = 2
    AND p.resolved_food_id IS NOT NULL
),
quarantined AS (
  UPDATE food_fodmap_measurements AS ffm
  SET
    is_current = FALSE,
    notes = CASE
      WHEN POSITION('QUARANTINED: amount_per_100g suspect, pending verification against Muir 2007 Table 2' IN COALESCE(ffm.notes, '')) > 0
        THEN ffm.notes
      ELSE CONCAT_WS(
        ' | ',
        NULLIF(ffm.notes, ''),
        'QUARANTINED: amount_per_100g suspect, pending verification against Muir 2007 Table 2'
      )
    END
  FROM rank2_target AS t
  WHERE ffm.food_id = t.food_id
    AND ffm.fodmap_subtype_id = t.fodmap_subtype_id
    AND ffm.source_record_ref = 'muir2007_fructan_table_v1'
    AND ffm.comparator = 'eq'
    AND ffm.amount_g_per_100g = 12.000000
    AND (
      ffm.is_current = TRUE
      OR POSITION('QUARANTINED: amount_per_100g suspect, pending verification against Muir 2007 Table 2' IN COALESCE(ffm.notes, '')) = 0
    )
  RETURNING ffm.measurement_id, ffm.food_id, ffm.fodmap_subtype_id
)
SELECT COUNT(*) AS rows_quarantined
FROM quarantined;

COMMIT;

SELECT
  p.priority_rank,
  p.food_label,
  p.variant_label,
  p.status,
  ffm.measurement_id,
  ffm.amount_g_per_100g,
  ffm.amount_g_per_serving,
  ffm.is_current,
  ffm.source_record_ref,
  ffm.notes
FROM phase2_priority_foods AS p
JOIN fodmap_subtypes AS fst
  ON fst.code = 'fructan'
JOIN food_fodmap_measurements AS ffm
  ON ffm.food_id = p.resolved_food_id
 AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
WHERE p.priority_rank = 2
ORDER BY ffm.created_at DESC, ffm.measurement_id DESC;
