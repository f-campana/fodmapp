BEGIN;

DO $$
DECLARE
  v_publish_id UUID;
  v_rollup_source_count INTEGER;
  v_rollup_published_count INTEGER;
  v_subtype_source_count INTEGER;
  v_subtype_published_count INTEGER;
  v_swap_source_count INTEGER;
  v_swap_published_count INTEGER;
BEGIN
  SELECT cur.publish_id
  INTO v_publish_id
  FROM publish_release_current cur
  WHERE cur.release_kind = 'api_v0_phase3';

  IF v_publish_id IS NULL THEN
    RAISE EXCEPTION 'api_v0_phase3 current publish release is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM publish_releases pr
    WHERE pr.publish_id = v_publish_id
      AND pr.release_kind = 'api_v0_phase3'
  ) THEN
    RAISE EXCEPTION 'current publish release % is not registered under api_v0_phase3', v_publish_id;
  END IF;

  SELECT COUNT(*)::int INTO v_rollup_source_count FROM v_phase3_rollups_latest_full;
  SELECT COUNT(*)::int INTO v_rollup_published_count FROM api_food_rollups_current;
  IF v_rollup_source_count <> v_rollup_published_count THEN
    RAISE EXCEPTION 'published rollup count mismatch: source %, published %', v_rollup_source_count, v_rollup_published_count;
  END IF;

  SELECT COUNT(*)::int INTO v_subtype_source_count FROM v_phase3_rollup_subtype_levels_latest;
  SELECT COUNT(*)::int INTO v_subtype_published_count FROM api_food_subtypes_current;
  IF v_subtype_source_count <> v_subtype_published_count THEN
    RAISE EXCEPTION 'published subtype count mismatch: source %, published %', v_subtype_source_count, v_subtype_published_count;
  END IF;

  WITH active_rules AS (
    SELECT
      r.swap_rule_id,
      p_from.priority_rank AS from_priority_rank,
      p_to.priority_rank AS to_priority_rank,
      vrt.driver_subtype_code AS driver_subtype
    FROM swap_rules r
    LEFT JOIN phase2_priority_foods p_from ON p_from.resolved_food_id = r.from_food_id
    LEFT JOIN phase2_priority_foods p_to ON p_to.resolved_food_id = r.to_food_id
    LEFT JOIN v_phase3_rollups_latest_full vrt ON vrt.food_id = r.to_food_id
    WHERE r.status = 'active'
      AND COALESCE(p_from.priority_rank, 0) <> 2
      AND COALESCE(p_to.priority_rank, 0) <> 2
  ),
  with_burden AS (
    SELECT
      ar.swap_rule_id
    FROM active_rules ar
    LEFT JOIN v_phase3_rollup_subtype_levels_latest fd
      ON fd.priority_rank = ar.from_priority_rank
     AND fd.subtype_code = ar.driver_subtype
    LEFT JOIN v_phase3_rollup_subtype_levels_latest td
      ON td.priority_rank = ar.to_priority_rank
     AND td.subtype_code = ar.driver_subtype
  )
  SELECT COUNT(*)::int
  INTO v_swap_source_count
  FROM with_burden;

  SELECT COUNT(*)::int INTO v_swap_published_count FROM api_swaps_current;
  IF v_swap_source_count <> v_swap_published_count THEN
    RAISE EXCEPTION 'published swap count mismatch: source %, published %', v_swap_source_count, v_swap_published_count;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM api_food_rollups_current r
    WHERE r.publish_id <> v_publish_id
  ) THEN
    RAISE EXCEPTION 'api_food_rollups_current exposes rows outside current publish release %', v_publish_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM api_food_subtypes_current s
    WHERE s.publish_id <> v_publish_id
  ) THEN
    RAISE EXCEPTION 'api_food_subtypes_current exposes rows outside current publish release %', v_publish_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM api_swaps_current s
    WHERE s.publish_id <> v_publish_id
  ) THEN
    RAISE EXCEPTION 'api_swaps_current exposes rows outside current publish release %', v_publish_id;
  END IF;
END
$$;

COMMIT;
