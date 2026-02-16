-- Phase 2 batch01 review packet.
-- Purpose: one review packet per unresolved row with candidates, including top3 candidates and deterministic recommendation.
-- Read-only: no updates are applied in this file.

CREATE OR REPLACE VIEW v_phase2_resolution_review_batch01 AS
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
    AND EXISTS (
      SELECT 1
      FROM v_phase2_resolution_candidates AS c
      WHERE c.priority_rank = p.priority_rank
    )
),
top_candidates AS (
  SELECT
    c.priority_rank,
    c.candidate_rank,
    c.match_score,
    c.match_flags,
    c.candidate_food_id,
    c.candidate_ciqual_code,
    c.candidate_name_fr,
    c.candidate_slug,
    c.recommended_resolution_method
  FROM v_phase2_resolution_candidates AS c
  WHERE c.candidate_rank <= 3
),
top1 AS (
  SELECT
    tc.priority_rank,
    tc.candidate_food_id AS top_candidate_food_id,
    tc.candidate_ciqual_code AS top_candidate_ciqual_code,
    tc.candidate_name_fr AS top_candidate_name_fr,
    tc.candidate_slug AS top_candidate_slug,
    tc.match_score AS top_match_score,
    tc.match_flags AS top_match_flags,
    tc.recommended_resolution_method AS recommended_method
  FROM top_candidates AS tc
  WHERE tc.candidate_rank = 1
),
rule_eval AS (
  SELECT
    u.priority_rank,
    u.gap_bucket,
    u.target_subtype,
    u.food_label,
    u.variant_label,
    u.food_slug_hint,
    t1.top_candidate_food_id,
    t1.top_candidate_ciqual_code,
    t1.top_candidate_name_fr,
    t1.top_candidate_slug,
    t1.top_match_score,
    t1.top_match_flags,
    t1.recommended_method,
    lower(u.food_label) AS food_label_lc,
    lower(u.variant_label) AS variant_label_lc,
    lower(t1.top_candidate_name_fr) AS candidate_name_lc,
    lower(t1.top_candidate_slug) AS candidate_slug_lc
  FROM unresolved AS u
  JOIN top1 AS t1
    ON t1.priority_rank = u.priority_rank
),
classified AS (
  SELECT
    r.*,
    (
      candidate_name_lc LIKE '%' || food_label_lc || '%'
      OR candidate_slug_lc LIKE '%' || replace(food_label_lc, ' ', '-') || '%'
    ) AS rule_same_base_ingredient,
    NOT (
      candidate_name_lc ~ '(préemball|fromage|saucisse|galette|confiture|cr[eè]me|boisson)'
    ) AS rule_no_disqualifier,
    CASE
      WHEN variant_label_lc LIKE '%raw%' THEN (
        candidate_name_lc ~ '(^|[^[:alpha:]])cru(e)?([^[:alpha:]]|$)'
        AND candidate_name_lc !~ '(appertis|égoutt|egoutt|préemball|fromage|confiture|galette|saucisse|boisson)'
      )
      WHEN variant_label_lc LIKE '%cooked%' THEN (
        candidate_name_lc ~ '(cuit(e)?|bouilli|saut[ée]?|po[eê]l[ée]?|vapeur|r[ôo]ti?)'
      )
      WHEN variant_label_lc LIKE '%powder%' OR food_label_lc LIKE '%farine%' THEN (
        candidate_name_lc ~ '(poudre|farine)'
      )
      WHEN variant_label_lc = 'canned drained' THEN (
        candidate_name_lc ~ '(appertis|conserve)'
        AND candidate_name_lc ~ '(égoutt|egoutt)'
      )
      WHEN variant_label_lc = 'dried' THEN (
        candidate_name_lc ~ '(\bsec\b|s[eé]ch[ée]|d[eé]shydrat)'
      )
      ELSE TRUE
    END AS rule_variant_compatible
  FROM rule_eval AS r
),
recommended AS (
  SELECT
    c.*,
    CASE
      WHEN c.rule_same_base_ingredient
       AND c.rule_no_disqualifier
       AND c.rule_variant_compatible
      THEN 'resolve'
      ELSE 'defer_pass3'
    END AS recommended_decision,
    CASE
      WHEN c.rule_same_base_ingredient
       AND c.rule_no_disqualifier
       AND c.rule_variant_compatible
      THEN 'Conservative gates passed on top candidate'
      ELSE 'Conservative gates failed on top candidate'
    END AS recommendation_reason
  FROM classified AS c
)
SELECT
  r.priority_rank,
  r.gap_bucket,
  r.target_subtype,
  r.food_label,
  r.variant_label,
  r.food_slug_hint,
  r.top_candidate_food_id,
  r.top_candidate_ciqual_code,
  r.top_candidate_name_fr,
  r.top_candidate_slug,
  r.top_match_score,
  r.top_match_flags,
  r.recommended_method,
  r.rule_same_base_ingredient,
  r.rule_variant_compatible,
  r.rule_no_disqualifier,
  r.recommended_decision,
  r.recommendation_reason,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'candidate_rank', tc.candidate_rank,
        'match_score', tc.match_score,
        'match_flags', tc.match_flags,
        'candidate_food_id', tc.candidate_food_id,
        'candidate_ciqual_code', tc.candidate_ciqual_code,
        'candidate_name_fr', tc.candidate_name_fr,
        'candidate_slug', tc.candidate_slug,
        'recommended_resolution_method', tc.recommended_resolution_method
      )
      ORDER BY tc.candidate_rank
    )
    FROM top_candidates AS tc
    WHERE tc.priority_rank = r.priority_rank
  ) AS top3_candidates
FROM recommended AS r
ORDER BY r.priority_rank;

SELECT *
FROM v_phase2_resolution_review_batch01
ORDER BY priority_rank;
