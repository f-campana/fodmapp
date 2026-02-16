-- Phase 2 resolver pass 2: ranked candidate report for manual confirmation.
-- DO NOT AUTO-APPLY: review candidates and run explicit UPDATE statements.

CREATE OR REPLACE VIEW v_phase2_resolution_candidates AS
WITH unresolved AS (
  SELECT
    p.priority_rank,
    p.gap_bucket,
    p.target_subtype,
    p.food_label,
    p.variant_label,
    p.food_slug_hint
  FROM phase2_priority_foods AS p
  WHERE p.resolved_food_id IS NULL
),
ciqual_pool AS (
  SELECT
    f.food_id AS candidate_food_id,
    f.canonical_name_fr AS candidate_name_fr,
    f.food_slug AS candidate_slug,
    fer.ref_value AS candidate_ciqual_code
  FROM foods AS f
  JOIN LATERAL (
    SELECT ref_value
    FROM food_external_refs AS fer
    WHERE fer.food_id = f.food_id
      AND fer.ref_system = 'CIQUAL'
    ORDER BY ref_value
    LIMIT 1
  ) AS fer ON TRUE
  WHERE f.canonical_name_fr IS NOT NULL
),
scored AS (
  SELECT
    u.priority_rank,
    u.gap_bucket,
    u.target_subtype,
    u.food_label,
    u.variant_label,
    c.candidate_food_id,
    c.candidate_ciqual_code,
    c.candidate_name_fr,
    c.candidate_slug,
    (
      CASE WHEN lower(c.candidate_name_fr) = lower(u.food_label) THEN 100 ELSE 0 END
      + CASE WHEN lower(c.candidate_name_fr) LIKE lower(u.food_label || ' %') THEN 30 ELSE 0 END
      + CASE WHEN lower(c.candidate_name_fr) LIKE lower('% ' || u.food_label || ' %') THEN 20 ELSE 0 END
      + CASE WHEN u.food_slug_hint IS NOT NULL AND lower(c.candidate_slug) = replace(lower(u.food_slug_hint), '_', '-') THEN 40 ELSE 0 END
      + CASE WHEN u.food_slug_hint IS NOT NULL AND lower(c.candidate_slug) LIKE '%' || replace(lower(u.food_slug_hint), '_', '-') || '%' THEN 20 ELSE 0 END
      + COALESCE(vt.variant_token_hits, 0) * 5
    )::INTEGER AS match_score,
    concat_ws(
      ', ',
      CASE WHEN lower(c.candidate_name_fr) = lower(u.food_label) THEN 'exact_name' END,
      CASE WHEN lower(c.candidate_name_fr) LIKE lower(u.food_label || ' %') THEN 'prefix_name' END,
      CASE WHEN lower(c.candidate_name_fr) LIKE lower('% ' || u.food_label || ' %') THEN 'contains_name' END,
      CASE WHEN u.food_slug_hint IS NOT NULL AND lower(c.candidate_slug) = replace(lower(u.food_slug_hint), '_', '-') THEN 'exact_slug' END,
      CASE WHEN u.food_slug_hint IS NOT NULL AND lower(c.candidate_slug) LIKE '%' || replace(lower(u.food_slug_hint), '_', '-') || '%' THEN 'contains_slug_hint' END,
      CASE WHEN COALESCE(vt.variant_token_hits, 0) > 0 THEN 'variant_token_hits=' || vt.variant_token_hits::TEXT END
    ) AS match_flags,
    CASE
      WHEN u.food_slug_hint IS NOT NULL AND (
        lower(c.candidate_slug) = replace(lower(u.food_slug_hint), '_', '-')
        OR lower(c.candidate_slug) LIKE '%' || replace(lower(u.food_slug_hint), '_', '-') || '%'
      ) THEN 'slug_match'
      ELSE 'name_match'
    END AS recommended_resolution_method
  FROM unresolved AS u
  JOIN ciqual_pool AS c
    ON c.candidate_name_fr ILIKE '%' || u.food_label || '%'
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::INTEGER AS variant_token_hits
    FROM regexp_split_to_table(lower(COALESCE(u.variant_label, '')), '[^[:alnum:]]+') AS tok
    WHERE length(tok) >= 3
      AND lower(c.candidate_name_fr) LIKE '%' || tok || '%'
  ) AS vt ON TRUE
),
ranked AS (
  SELECT
    s.*,
    ROW_NUMBER() OVER (
      PARTITION BY s.priority_rank
      ORDER BY s.match_score DESC, s.candidate_name_fr, s.candidate_food_id
    ) AS candidate_rank
  FROM scored AS s
)
SELECT
  priority_rank,
  gap_bucket,
  target_subtype,
  food_label,
  variant_label,
  candidate_rank,
  match_score,
  match_flags,
  candidate_food_id,
  candidate_ciqual_code,
  candidate_name_fr,
  candidate_slug,
  recommended_resolution_method
FROM ranked
WHERE candidate_rank <= 10
ORDER BY priority_rank, candidate_rank;

SELECT *
FROM v_phase2_resolution_candidates
ORDER BY priority_rank, candidate_rank;
