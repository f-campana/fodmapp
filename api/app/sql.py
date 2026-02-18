from __future__ import annotations

from typing import Any, Dict, List, Optional

from psycopg import Connection


SQL_GET_FOOD = """
SELECT
  f.food_id,
  f.food_slug,
  f.canonical_name_fr,
  f.canonical_name_en,
  f.preparation_state::text AS preparation_state,
  f.status,
  lr.source_slug
FROM foods f
LEFT JOIN LATERAL (
  SELECT r.source_slug
  FROM v_phase3_rollups_latest_full r
  WHERE r.food_id = f.food_id
  ORDER BY r.computed_at DESC
  LIMIT 1
) lr ON TRUE
WHERE f.food_slug = %(food_slug)s
"""

SQL_GET_FOOD_ROLLUP = """
SELECT
  f.food_id,
  f.food_slug,
  f.canonical_name_fr,
  f.canonical_name_en,
  r.rollup_serving_g,
  r.overall_level::text AS overall_level,
  r.driver_subtype_code AS driver_subtype,
  r.known_subtypes_count,
  r.coverage_ratio,
  r.source_slug,
  r.computed_at AS rollup_computed_at
FROM foods f
LEFT JOIN LATERAL (
  SELECT
    rr.rollup_serving_g,
    rr.overall_level,
    rr.driver_subtype_code,
    rr.known_subtypes_count,
    rr.coverage_ratio,
    rr.source_slug,
    rr.computed_at
  FROM v_phase3_rollups_latest_full rr
  WHERE rr.food_id = f.food_id
  ORDER BY rr.computed_at DESC
  LIMIT 1
) r ON TRUE
WHERE f.food_slug = %(food_slug)s
"""

SQL_GET_FOOD_IDENTITY = """
SELECT
  f.food_id,
  f.food_slug,
  f.canonical_name_fr,
  f.canonical_name_en
FROM foods f
WHERE f.food_slug = %(food_slug)s
"""

SQL_GET_TRAIT_ROLE = """
SELECT
  c.role_code AS code,
  c.label_fr,
  c.label_en
FROM food_culinary_roles fcr
JOIN culinary_roles c ON c.role_code = fcr.role_code
WHERE fcr.food_id = %(food_id)s
ORDER BY c.role_code
"""

SQL_GET_TRAIT_FLAVOR = """
SELECT
  fn.flavor_code AS code,
  fn.label_fr,
  fn.label_en
FROM food_flavor_profiles ffp
JOIN flavor_notes fn ON fn.flavor_code = ffp.flavor_code
WHERE ffp.food_id = %(food_id)s
ORDER BY fn.flavor_code
"""

SQL_GET_TRAIT_TEXTURE = """
SELECT
  tt.texture_code AS code,
  tt.label_fr,
  tt.label_en
FROM food_texture_profiles ftp
JOIN texture_traits tt ON tt.texture_code = ftp.texture_code
WHERE ftp.food_id = %(food_id)s
ORDER BY tt.texture_code
"""

SQL_GET_TRAIT_BEHAVIOR = """
SELECT
  cb.behavior_code AS code,
  cb.label_fr,
  cb.label_en
FROM food_cooking_behaviors fcb
JOIN cooking_behaviors cb ON cb.behavior_code = fcb.behavior_code
WHERE fcb.food_id = %(food_id)s
ORDER BY cb.behavior_code
"""

SQL_GET_TRAIT_CUISINE = """
SELECT
  ct.cuisine_code AS code,
  ct.label_fr,
  ct.label_en
FROM food_cuisine_affinities fca
JOIN cuisine_tags ct ON ct.cuisine_code = fca.cuisine_code
WHERE fca.food_id = %(food_id)s
ORDER BY ct.cuisine_code
"""

SQL_GET_FOOD_SLUG_EXISTS = """
SELECT f.food_slug
FROM foods f
WHERE f.food_slug = %(food_slug)s
"""

SQL_LIST_SWAPS = """
WITH from_food AS (
  SELECT food_id
  FROM foods
  WHERE food_slug = %(from_slug)s
),
active_rules AS (
  SELECT
    r.swap_rule_id,
    f_from.food_slug AS from_food_slug,
    f_to.food_slug AS to_food_slug,
    f_from.canonical_name_fr AS from_food_name_fr,
    f_from.canonical_name_en AS from_food_name_en,
    f_to.canonical_name_fr AS to_food_name_fr,
    f_to.canonical_name_en AS to_food_name_en,
    r.instruction_fr,
    COALESCE(r.instruction_en, r.instruction_fr) AS instruction_en,
    r.status::text AS rule_status,
    rs.fodmap_safety_score,
    rs.overall_score,
    rs.scoring_version,
    src.source_slug,
    p_from.priority_rank AS from_priority_rank,
    p_to.priority_rank AS to_priority_rank,
    COALESCE(vrf.overall_level::text, 'unknown') AS from_overall_level,
    COALESCE(vrt.overall_level::text, 'unknown') AS to_overall_level,
    vrt.driver_subtype_code AS driver_subtype,
    COALESCE(vrt.coverage_ratio, 0)::numeric(6,4) AS coverage_ratio,
    COALESCE(vrt.computed_at, vrf.computed_at) AS rollup_computed_at
  FROM swap_rules r
  JOIN from_food ff ON ff.food_id = r.from_food_id
  JOIN foods f_from ON f_from.food_id = r.from_food_id
  JOIN foods f_to ON f_to.food_id = r.to_food_id
  JOIN swap_rule_scores rs ON rs.swap_rule_id = r.swap_rule_id
  JOIN sources src ON src.source_id = r.source_id
  LEFT JOIN phase2_priority_foods p_from ON p_from.resolved_food_id = r.from_food_id
  LEFT JOIN phase2_priority_foods p_to ON p_to.resolved_food_id = r.to_food_id
  LEFT JOIN v_phase3_rollups_latest_full vrf ON vrf.food_id = r.from_food_id
  LEFT JOIN v_phase3_rollups_latest_full vrt ON vrt.food_id = r.to_food_id
  WHERE r.status = 'active'
    AND COALESCE(p_from.priority_rank, 0) <> 2
    AND COALESCE(p_to.priority_rank, 0) <> 2
    AND rs.fodmap_safety_score >= %(min_safety_score)s
),
with_burden AS (
  SELECT
    ar.*,
    fd.burden_ratio AS from_burden_ratio,
    td.burden_ratio AS to_burden_ratio
  FROM active_rules ar
  LEFT JOIN v_phase3_rollup_subtype_levels_latest fd
    ON fd.priority_rank = ar.from_priority_rank
   AND fd.subtype_code = ar.driver_subtype
  LEFT JOIN v_phase3_rollup_subtype_levels_latest td
    ON td.priority_rank = ar.to_priority_rank
   AND td.subtype_code = ar.driver_subtype
)
SELECT
  from_food_slug,
  to_food_slug,
  from_food_name_fr,
  from_food_name_en,
  to_food_name_fr,
  to_food_name_en,
  instruction_fr,
  instruction_en,
  from_overall_level,
  to_overall_level,
  driver_subtype,
  from_burden_ratio,
  to_burden_ratio,
  coverage_ratio,
  fodmap_safety_score,
  overall_score,
  rule_status,
  scoring_version,
  source_slug,
  rollup_computed_at
FROM with_burden
ORDER BY
  fodmap_safety_score DESC,
  overall_score DESC,
  CASE to_overall_level
    WHEN 'none' THEN 1
    WHEN 'low' THEN 2
    WHEN 'moderate' THEN 3
    WHEN 'high' THEN 4
    ELSE 5
  END ASC,
  coverage_ratio DESC,
  to_food_slug ASC
LIMIT %(limit)s
"""


def fetch_one(conn: Connection, query: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    cur = conn.execute(query, params)
    return cur.fetchone()


def fetch_all(conn: Connection, query: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    cur = conn.execute(query, params)
    return list(cur.fetchall())
