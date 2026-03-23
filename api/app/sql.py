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
  r.source_slug
FROM foods f
LEFT JOIN api_food_rollups_current r ON r.food_id = f.food_id
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
LEFT JOIN api_food_rollups_current r ON r.food_id = f.food_id
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

SQL_SEARCH_FOODS = """
SELECT
  f.food_slug,
  f.canonical_name_fr,
  f.canonical_name_en,
  r.overall_level::text AS overall_level,
  r.driver_subtype_code AS driver_subtype,
  r.coverage_ratio,
  r.computed_at AS rollup_computed_at
FROM foods f
LEFT JOIN api_food_rollups_current r ON r.food_id = f.food_id
WHERE f.food_slug ILIKE %(pattern)s
   OR COALESCE(f.canonical_name_fr, '') ILIKE %(pattern)s
   OR COALESCE(f.canonical_name_en, '') ILIKE %(pattern)s
ORDER BY
  CASE
    WHEN f.food_slug = %(q)s THEN 0
    WHEN f.food_slug ILIKE %(prefix_pattern)s THEN 1
    WHEN COALESCE(f.canonical_name_fr, '') ILIKE %(prefix_pattern)s THEN 2
    WHEN COALESCE(f.canonical_name_en, '') ILIKE %(prefix_pattern)s THEN 3
    ELSE 4
  END,
  CASE
    WHEN r.overall_level IS NOT NULL AND r.coverage_ratio IS NOT NULL THEN 0
    ELSE 1
  END,
  COALESCE(r.coverage_ratio, -1) DESC,
  r.computed_at DESC NULLS LAST,
  f.food_slug ASC
LIMIT %(limit)s
"""

SQL_GET_PRODUCT_LOOKUP = """
SELECT
  %(normalized_code)s AS normalized_code,
  pc.product_id,
  COALESCE(pc.canonical_format, latest_snapshot.canonical_format, refresh.canonical_format) AS canonical_format,
  p.product_name_fr,
  p.product_name_en,
  p.brand,
  provider.source_slug AS provider_slug,
  provider.source_name AS provider_name,
  latest_snapshot.fetch_status AS provider_status,
  latest_snapshot.fetched_at AS provider_last_synced_at,
  latest_snapshot.expires_at AS snapshot_expires_at,
  latest_snapshot.last_error_code,
  refresh.status AS refresh_status,
  refresh.last_requested_at AS refresh_requested_at,
  refresh.cooldown_until,
  assessment.assessment_status
FROM (SELECT 1) AS stub
LEFT JOIN product_codes pc
  ON pc.normalized_code = %(normalized_code)s
LEFT JOIN products p
  ON p.product_id = pc.product_id
LEFT JOIN LATERAL (
  SELECT
    canonical_format,
    provider_source_id,
    fetch_status,
    fetched_at,
    expires_at,
    last_error_code
  FROM product_provider_snapshots
  WHERE normalized_code = %(normalized_code)s
  ORDER BY fetched_at DESC
  LIMIT 1
) latest_snapshot ON TRUE
LEFT JOIN product_refresh_requests refresh
  ON refresh.normalized_code = %(normalized_code)s
LEFT JOIN sources provider
  ON provider.source_id = COALESCE(
    pc.provider_source_id,
    latest_snapshot.provider_source_id,
    refresh.provider_source_id,
    p.source_id
  )
LEFT JOIN LATERAL (
  SELECT assessment_status
  FROM product_assessments
  WHERE product_id = pc.product_id
    AND method_version = 'products_guided_v1'
  LIMIT 1
) assessment ON TRUE
"""

SQL_GET_PRODUCT = """
SELECT
  p.product_id,
  p.gtin13,
  p.open_food_facts_code,
  p.product_name_fr,
  p.product_name_en,
  p.brand,
  p.categories_tags,
  p.countries_tags,
  p.ingredients_text_fr,
  p.last_synced_at,
  p.updated_at,
  provider.source_slug AS provider_slug,
  provider.source_name AS provider_name,
  code.normalized_code AS primary_normalized_code,
  code.canonical_format,
  latest_snapshot.fetch_status AS provider_status,
  latest_snapshot.fetched_at AS provider_last_synced_at,
  latest_snapshot.expires_at AS snapshot_expires_at,
  latest_snapshot.last_error_code,
  refresh.status AS refresh_status,
  refresh.last_requested_at AS refresh_requested_at,
  assessment.assessment_status
FROM products p
LEFT JOIN sources provider
  ON provider.source_id = p.source_id
LEFT JOIN LATERAL (
  SELECT
    normalized_code,
    canonical_format
  FROM product_codes
  WHERE product_id = p.product_id
  ORDER BY updated_at DESC, normalized_code ASC
  LIMIT 1
) code ON TRUE
LEFT JOIN LATERAL (
  SELECT
    fetch_status,
    fetched_at,
    expires_at,
    last_error_code
  FROM product_provider_snapshots
  WHERE product_id = p.product_id
  ORDER BY fetched_at DESC
  LIMIT 1
) latest_snapshot ON TRUE
LEFT JOIN product_refresh_requests refresh
  ON refresh.normalized_code = code.normalized_code
LEFT JOIN LATERAL (
  SELECT assessment_status
  FROM product_assessments
  WHERE product_id = p.product_id
    AND method_version = 'products_guided_v1'
  LIMIT 1
) assessment ON TRUE
WHERE p.product_id = %(product_id)s
"""

SQL_GET_PRODUCT_INGREDIENT_ROWS = """
SELECT
  pi.product_id,
  pi.line_no,
  pi.ingredient_text_fr,
  pi.normalized_name,
  pi.declared_share_pct,
  pi.parse_confidence,
  pi.is_substantive,
  pi.parser_version,
  pfc.candidate_rank,
  pfc.match_method,
  pfc.score,
  pfc.confidence_tier,
  pfc.signal_breakdown,
  pfc.is_selected,
  f.food_slug,
  COALESCE(f.canonical_name_fr, f.food_slug) AS canonical_name_fr,
  COALESCE(f.canonical_name_en, COALESCE(f.canonical_name_fr, f.food_slug)) AS canonical_name_en
FROM product_ingredients pi
LEFT JOIN product_food_candidates pfc
  ON pfc.product_id = pi.product_id
 AND pfc.line_no = pi.line_no
LEFT JOIN foods f
  ON f.food_id = pfc.food_id
WHERE pi.product_id = %(product_id)s
ORDER BY pi.line_no ASC, pfc.candidate_rank ASC NULLS LAST
"""

SQL_GET_PRODUCT_ASSESSMENT = """
SELECT
  pa.product_assessment_id,
  pa.product_id,
  pa.method_version,
  pa.contract_tier,
  pa.assessment_mode,
  pa.assessment_status,
  pa.confidence_tier,
  pa.heuristic_overall_level::text AS heuristic_overall_level,
  pa.heuristic_max_low_portion_g,
  pa.numeric_guidance_status,
  pa.numeric_guidance_basis,
  pa.limiting_subtypes,
  pa.caveats,
  pa.provider_last_synced_at,
  pa.computed_at,
  provider.source_slug AS provider_slug,
  dominant.food_slug AS dominant_food_slug,
  COALESCE(dominant.canonical_name_fr, dominant.food_slug) AS dominant_food_name_fr,
  COALESCE(
    dominant.canonical_name_en,
    COALESCE(dominant.canonical_name_fr, dominant.food_slug)
  ) AS dominant_food_name_en
FROM product_assessments pa
JOIN sources provider
  ON provider.source_id = pa.provider_source_id
LEFT JOIN foods dominant
  ON dominant.food_id = pa.dominant_food_id
WHERE pa.product_id = %(product_id)s
  AND pa.method_version = 'products_guided_v1'
"""

SQL_GET_PRODUCT_ASSESSMENT_SUBTYPES = """
SELECT
  pas.subtype_code,
  pas.subtype_level::text AS subtype_level,
  source_food.food_slug AS source_food_slug,
  COALESCE(source_food.canonical_name_fr, source_food.food_slug) AS source_food_name_fr,
  COALESCE(
    source_food.canonical_name_en,
    COALESCE(source_food.canonical_name_fr, source_food.food_slug)
  ) AS source_food_name_en,
  pas.low_max_g,
  pas.moderate_max_g,
  pas.burden_ratio
FROM product_assessment_subtypes pas
LEFT JOIN foods source_food
  ON source_food.food_id = pas.source_food_id
WHERE pas.product_assessment_id = %(product_assessment_id)s
ORDER BY pas.subtype_code ASC
"""

SQL_GET_PRODUCT_REFRESH_REQUEST = """
SELECT
  normalized_code,
  status,
  last_requested_at,
  refresh_after,
  cooldown_until,
  product_id
FROM product_refresh_requests
WHERE normalized_code = %(normalized_code)s
"""

SQL_INSERT_PRODUCT_REFRESH_REQUEST = """
INSERT INTO product_refresh_requests (
  normalized_code,
  canonical_format,
  provider_source_id,
  product_id,
  status,
  requested_at,
  last_requested_at,
  refresh_after,
  cooldown_until,
  created_at,
  updated_at
) VALUES (
  %(normalized_code)s,
  %(canonical_format)s,
  (SELECT source_id FROM sources WHERE source_slug = 'open_food_facts'),
  %(product_id)s,
  'queued',
  %(now)s,
  %(now)s,
  %(now)s,
  %(cooldown_until)s,
  %(now)s,
  %(now)s
)
RETURNING
  normalized_code,
  status,
  last_requested_at,
  refresh_after,
  cooldown_until,
  product_id
"""

SQL_QUEUE_PRODUCT_REFRESH_REQUEST = """
UPDATE product_refresh_requests
SET canonical_format = %(canonical_format)s,
    product_id = COALESCE(%(product_id)s, product_id),
    status = 'queued',
    last_requested_at = %(now)s,
    refresh_after = %(now)s,
    cooldown_until = %(cooldown_until)s,
    updated_at = %(now)s
WHERE normalized_code = %(normalized_code)s
RETURNING
  normalized_code,
  status,
  last_requested_at,
  refresh_after,
  cooldown_until,
  product_id
"""

SQL_TOUCH_PRODUCT_REFRESH_REQUEST = """
UPDATE product_refresh_requests
SET canonical_format = %(canonical_format)s,
    product_id = COALESCE(%(product_id)s, product_id),
    updated_at = %(now)s
WHERE normalized_code = %(normalized_code)s
RETURNING
  normalized_code,
  status,
  last_requested_at,
  refresh_after,
  cooldown_until,
  product_id
"""

SQL_INSERT_PRODUCT_REVIEW_EVENT = """
INSERT INTO product_review_events (
  product_id,
  normalized_code,
  event_type,
  actor,
  payload
) VALUES (
  %(product_id)s,
  %(normalized_code)s,
  %(event_type)s,
  %(actor)s,
  %(payload)s
)
"""

SQL_LIST_SAFE_HARBORS = """
SELECT
  c.cohort_code,
  c.label_fr,
  c.label_en,
  c.rationale_fr,
  c.rationale_en,
  c.caveat_fr,
  c.caveat_en,
  c.sort_order,
  f.food_slug,
  f.canonical_name_fr,
  f.canonical_name_en,
  f.preparation_state::text AS preparation_state
FROM food_safe_harbor_assignments a
JOIN safe_harbor_cohorts c ON c.cohort_code = a.cohort_code
JOIN foods f ON f.food_id = a.food_id
WHERE a.assignment_version = 'safe_harbor_v1'
ORDER BY c.sort_order ASC, f.food_slug ASC
"""

SQL_GET_SAFE_HARBOR_META = """
SELECT
  rule.source_slug AS cohort_rule_source_slug,
  COALESCE(MAX(a.assignment_version), 'safe_harbor_v1') AS cohort_rule_version,
  data.source_slug AS data_source_slug,
  data.source_name AS data_source_name,
  data.dataset_version AS data_source_version,
  data.published_at AS data_source_published_at
FROM sources rule
JOIN sources data ON data.source_slug = 'ciqual_2025'
LEFT JOIN food_safe_harbor_assignments a
  ON a.rule_source_id = rule.source_id
 AND a.data_source_id = data.source_id
WHERE rule.source_slug = 'internal_rules_v1'
GROUP BY
  rule.source_slug,
  data.source_slug,
  data.source_name,
  data.dataset_version,
  data.published_at
"""

SQL_GET_FOOD_SUBTYPES = """
SELECT
  v.subtype_code,
  v.subtype_level::text AS subtype_level,
  v.amount_g_per_serving,
  v.comparator::text AS comparator,
  v.low_max_g,
  v.moderate_max_g,
  v.burden_ratio,
  v.signal_source_kind,
  v.signal_source_slug,
  v.threshold_source_slug,
  v.is_default_threshold,
  v.is_polyol_proxy,
  v.rollup_serving_g,
  v.computed_at
FROM api_food_subtypes_current v
WHERE v.food_id = %(food_id)s
ORDER BY
  CASE v.subtype_code
    WHEN 'fructan' THEN 1
    WHEN 'gos' THEN 2
    WHEN 'sorbitol' THEN 3
    WHEN 'mannitol' THEN 4
    WHEN 'fructose' THEN 5
    WHEN 'lactose' THEN 6
    ELSE 7
  END ASC
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
FROM api_swaps_current
WHERE from_food_slug = %(from_slug)s
  AND fodmap_safety_score >= %(min_safety_score)s
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

SQL_HAS_API_PUBLISH_META_VIEW = """
SELECT to_regclass('public.api_publish_meta_current') AS relation_name
"""

SQL_GET_API_PUBLISH_META = """
SELECT
  publish_id,
  published_at,
  rollup_computed_at_max
FROM api_publish_meta_current
LIMIT 1
"""

SQL_GET_ACTIVE_USER_CONSENT = """
SELECT
  consent_id,
  user_id,
  policy_version,
  legal_basis,
  consent_scope,
  consent_method,
  source,
  source_ref,
  granted_at_utc,
  revoked_at_utc,
  expires_at_utc,
  policy_fingerprint,
  scope_signature,
  evidence_uri,
  evidence_hash,
  revocation_reason,
  status,
  parent_consent_id,
  replaced_by_consent_id,
  created_at_utc,
  updated_at_utc
FROM user_consent_ledger
WHERE user_id = %(user_id)s
  AND status = 'active'
ORDER BY granted_at_utc DESC
LIMIT 1
"""

SQL_GET_USER_CONSENT_LATEST = """
SELECT
  consent_id,
  user_id,
  policy_version,
  legal_basis,
  consent_scope,
  consent_method,
  source,
  source_ref,
  granted_at_utc,
  revoked_at_utc,
  expires_at_utc,
  policy_fingerprint,
  scope_signature,
  evidence_uri,
  evidence_hash,
  revocation_reason,
  status,
  parent_consent_id,
  replaced_by_consent_id,
  created_at_utc,
  updated_at_utc
FROM user_consent_ledger
WHERE user_id = %(user_id)s
ORDER BY granted_at_utc DESC
LIMIT 1
"""

SQL_UPSERT_AUTH_IDENTITY = """
INSERT INTO me_auth_identities (
  user_id,
  auth_provider,
  auth_subject,
  last_authenticated_at_utc
)
VALUES (
  %(user_id)s,
  'clerk',
  %(auth_subject)s,
  NOW()
)
ON CONFLICT (auth_provider, auth_subject)
DO UPDATE SET
  last_authenticated_at_utc = NOW()
RETURNING user_id, auth_provider, auth_subject
"""

SQL_GET_CONSENT_HISTORY = """
SELECT
  e.event_type AS event,
  e.at_utc,
  l.policy_version,
  l.source,
  e.reason
FROM user_consent_ledger_events e
JOIN user_consent_ledger l ON l.consent_id = e.consent_id
WHERE l.user_id = %(user_id)s
ORDER BY e.at_utc DESC
LIMIT 200
"""

SQL_GET_USER_CONSENT_EVENTS = """
SELECT
  e.event_id,
  e.consent_id,
  e.event_type,
  e.actor_type,
  e.actor_id,
  e.reason,
  e.metadata_json,
  e.event_hash,
  e.prev_hash,
  l.policy_version,
  l.source
FROM user_consent_ledger_events e
JOIN user_consent_ledger l ON l.consent_id = e.consent_id
WHERE l.user_id = %(user_id)s
ORDER BY e.consent_id, e.at_utc, e.event_id
"""

SQL_GET_LAST_CONSENT_EVENT = """
SELECT event_hash, prev_hash
FROM user_consent_ledger_events
WHERE consent_id = %(consent_id)s
ORDER BY at_utc DESC
LIMIT 1
"""

SQL_GET_ALL_CONSENTS = """
SELECT consent_id, status, policy_version
FROM user_consent_ledger
WHERE user_id = %(user_id)s
ORDER BY granted_at_utc DESC
"""

SQL_INSERT_USER_CONSENT = """
INSERT INTO user_consent_ledger (
  user_id,
  device_subject_id,
  tenant_scope,
  policy_version,
  legal_basis,
  consent_scope,
  consent_method,
  source,
  source_ref,
  granted_at_utc,
  expires_at_utc,
  policy_fingerprint,
  scope_signature,
  evidence_uri,
  evidence_hash,
  revocation_reason,
  revocation_actor_id,
  status,
  parent_consent_id,
  created_by_actor_id,
  updated_by_actor_id
)
VALUES (
  %(user_id)s,
  %(device_subject_id)s,
  %(tenant_scope)s,
  %(policy_version)s,
  %(legal_basis)s,
  %(consent_scope)s,
  %(consent_method)s,
  %(source)s,
  %(source_ref)s,
  COALESCE(%(granted_at_utc)s, NOW()),
  %(expires_at_utc)s,
  %(policy_fingerprint)s,
  %(scope_signature)s,
  %(evidence_uri)s,
  %(evidence_hash)s,
  %(revocation_reason)s,
  %(revocation_actor_id)s,
  %(status)s,
  %(parent_consent_id)s,
  %(actor_id)s,
  %(actor_id)s
)
RETURNING consent_id
"""

SQL_UPDATE_CONSENT_STATUS = """
UPDATE user_consent_ledger
SET status = %(status)s,
    revoked_at_utc = COALESCE(revoked_at_utc, NOW()),
    updated_at_utc = NOW(),
    updated_by_actor_id = %(actor_id)s,
    replaced_by_consent_id = %(replaced_by_consent_id)s
WHERE consent_id = %(consent_id)s
"""

SQL_INSERT_CONSENT_EVENT = """
INSERT INTO user_consent_ledger_events (
  consent_id,
  event_type,
  actor_type,
  actor_id,
  reason,
  metadata_json,
  event_hash,
  prev_hash
)
VALUES (
  %(consent_id)s,
  %(event_type)s,
  %(actor_type)s,
  %(actor_id)s,
  %(reason)s,
  %(metadata_json)s,
  %(event_hash)s,
  %(prev_hash)s
)
"""

SQL_INSERT_DEVICE_KEY = """
INSERT INTO me_device_signing_keys (
  user_id,
  device_id,
  key_id,
  secret_b64,
  algorithm,
  status,
  valid_from,
  valid_until
)
VALUES (
  %(user_id)s,
  %(device_id)s,
  %(key_id)s,
  %(secret_b64)s,
  %(algorithm)s,
  'active',
  NOW(),
  %(valid_until)s
)
ON CONFLICT (device_id, key_id) DO UPDATE
SET secret_b64 = EXCLUDED.secret_b64,
    algorithm = EXCLUDED.algorithm,
    status = 'active',
    valid_until = EXCLUDED.valid_until,
    revoked_at = NULL,
    valid_from = NOW()
"""

SQL_GET_ACTIVE_DEVICE_KEY = """
SELECT secret_b64, algorithm
FROM me_device_signing_keys
WHERE user_id = %(user_id)s
  AND device_id = %(device_id)s
  AND key_id = %(key_id)s
  AND status = 'active'
  AND (valid_until IS NULL OR valid_until > NOW())
  AND (revoked_at IS NULL OR revoked_at > NOW())
"""

SQL_GET_ACTIVE_DEVICE_KEYS = """
SELECT key_id, secret_b64, algorithm
FROM me_device_signing_keys
WHERE user_id = %(user_id)s
  AND device_id = %(device_id)s
  AND status = 'active'
  AND (valid_until IS NULL OR valid_until > NOW())
  AND (revoked_at IS NULL OR revoked_at > NOW())
ORDER BY valid_from DESC NULLS LAST, created_at DESC
LIMIT 1
"""

SQL_CREATE_SYNC_BATCH_SEQUENCE = """
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relkind = 'S' AND relname = 'sync_mutation_batch_seq'
  ) THEN
    CREATE SEQUENCE sync_mutation_batch_seq START 1;
  END IF;
END
$$
"""

SQL_NEXT_SYNC_BATCH_SEQ = """
SELECT nextval('sync_mutation_batch_seq') AS next_seq
"""

SQL_GET_ACCOUNT_DELETE_STATE = """
SELECT delete_request_id, status
FROM me_delete_jobs
WHERE user_id = %(user_id)s
  AND scope = 'all'
  AND status IN ('processing', 'completed')
ORDER BY requested_at DESC
LIMIT 1
"""

SQL_GET_SWAP_RULE_FOR_MUTATION = """
SELECT
  ps.rule_status::text AS rule_status,
  ps.from_food_slug,
  ps.to_food_slug,
  ps.fodmap_safety_score,
  ps.overall_score,
  ps.scoring_version,
  COALESCE(ps.from_overall_level::text, 'unknown') AS from_overall_level,
  COALESCE(ps.to_overall_level::text, 'unknown') AS to_overall_level,
  COALESCE(ps.coverage_ratio, 0)::numeric(6,4) AS coverage_ratio,
  ps.from_priority_rank,
  ps.to_priority_rank,
  ps.from_burden_ratio,
  ps.to_burden_ratio
FROM api_swaps_current ps
WHERE ps.from_food_slug = %(from_food_slug)s
  AND ps.to_food_slug = %(to_food_slug)s
LIMIT 1
"""

SQL_REVOKE_DEVICE_KEYS = """
UPDATE me_device_signing_keys
SET status = 'revoked',
    revoked_at = NOW(),
    valid_until = NOW()
WHERE user_id = %(user_id)s
"""

SQL_GET_SYNC_SCOPE = """
SELECT consent_scope
FROM user_consent_ledger
WHERE user_id = %(user_id)s
  AND status = 'active'
  AND consent_scope ->> 'sync_mutations' = 'true'
ORDER BY granted_at_utc DESC
LIMIT 1
"""

SQL_GET_QUEUE_BY_IDEMPOTENCY = """
SELECT idempotency_key, payload_hash, status, error_code
  , chain_prev_hash
  , chain_item_hash
FROM me_mutation_queue
WHERE user_id = %(user_id)s
  AND idempotency_key = %(idempotency_key)s
  AND replay_window_expires_at > NOW()
"""

SQL_GET_QUEUE_BY_IDEMPOTENCY_ANY = """
SELECT idempotency_key, payload_hash, status, error_code, replay_window_expires_at
FROM me_mutation_queue
WHERE user_id = %(user_id)s
  AND idempotency_key = %(idempotency_key)s
"""

SQL_INSERT_QUEUE = """
INSERT INTO me_mutation_queue (
  idempotency_key,
  queue_item_id,
  user_id,
  device_id,
  app_install_id,
  op,
  entity_type,
  entity_id,
  client_seq,
  base_version,
  payload_hash,
  aad,
  envelope_json,
  signature_algorithm,
  signature_kid,
  signature,
  chain_prev_hash,
  chain_item_hash,
  status,
  error_code,
  error_detail,
  replay_window_expires_at
)
VALUES (
  %(idempotency_key)s,
  %(queue_item_id)s,
  %(user_id)s,
  %(device_id)s,
  %(app_install_id)s,
  %(op)s,
  %(entity_type)s,
  %(entity_id)s,
  %(client_seq)s,
  %(base_version)s,
  %(payload_hash)s,
  %(aad)s,
  %(envelope_json)s,
  %(signature_algorithm)s,
  %(signature_kid)s,
  %(signature)s,
  %(chain_prev_hash)s,
  %(chain_item_hash)s,
  %(status)s,
  %(error_code)s,
  %(error_detail)s,
  NOW() + make_interval(secs => %(ttl_seconds)s)
)
"""

SQL_DELETE_QUEUE_BY_IDEMPOTENCY = """
DELETE FROM me_mutation_queue
WHERE user_id = %(user_id)s
  AND idempotency_key = %(idempotency_key)s
"""

SQL_GET_ENTITY_VERSION = """
SELECT current_version
FROM me_entity_versions
WHERE user_id = %(user_id)s
  AND entity_type = %(entity_type)s
  AND entity_id = %(entity_id)s
"""

SQL_UPSERT_ENTITY_VERSION = """
INSERT INTO me_entity_versions (
  user_id,
  entity_type,
  entity_id,
  current_version,
  updated_at
)
VALUES (
  %(user_id)s,
  %(entity_type)s,
  %(entity_id)s,
  %(current_version)s,
  NOW()
)
ON CONFLICT (user_id, entity_type, entity_id)
DO UPDATE SET
  current_version = EXCLUDED.current_version,
  updated_at = NOW()
"""

SQL_INSERT_EXPORT_JOB = """
INSERT INTO me_export_jobs (
  user_id,
  idempotency_key,
  requested_by_actor_id,
  status,
  requested_scope,
  include_domain,
  rows_by_domain,
  redactions,
  manifest,
  proof,
  download_url
)
VALUES (
  %(user_id)s,
  %(idempotency_key)s,
  %(requested_by_actor_id)s,
  %(status)s,
  %(requested_scope)s,
  %(include_domain)s,
  %(rows_by_domain)s,
  %(redactions)s,
  %(manifest)s,
  %(proof)s,
  %(download_url)s
)
RETURNING export_id, expires_at
"""

SQL_GET_EXPORT_JOB_BY_IDEMPOTENCY = """
SELECT
  export_id,
  status,
  idempotency_key,
  requested_at,
  requested_scope,
  include_domain,
  rows_by_domain,
  redactions,
  manifest,
  proof,
  error_code,
  error_detail,
  expires_at
FROM me_export_jobs
WHERE user_id = %(user_id)s
  AND idempotency_key = %(idempotency_key)s
"""

SQL_GET_EXPORT_JOB = """
SELECT
  export_id,
  idempotency_key,
  status,
  requested_at,
  requested_scope,
  include_domain,
  rows_by_domain,
  redactions,
  manifest,
  proof,
  download_url,
  error_code,
  error_detail,
  expires_at
FROM me_export_jobs
WHERE export_id = %(export_id)s
  AND user_id = %(user_id)s
"""

SQL_UPDATE_EXPORT_JOB = """
UPDATE me_export_jobs
SET status = %(status)s,
    rows_by_domain = %(rows_by_domain)s,
    manifest = %(manifest)s,
    proof = %(proof)s,
    download_url = %(download_url)s,
    error_code = %(error_code)s,
    error_detail = %(error_detail)s
WHERE export_id = %(export_id)s
"""

SQL_COUNT_EXPORT_JOBS = """
SELECT COUNT(*) AS count
FROM me_export_jobs
WHERE user_id = %(user_id)s
"""

SQL_INVALIDATE_EXPORT_JOBS = """
UPDATE me_export_jobs
SET status = 'failed',
    error_code = %(error_code)s,
    error_detail = %(error_detail)s
WHERE user_id = %(user_id)s
  AND status IN ('accepted', 'queued', 'processing', 'ready', 'ready_with_redactions')
"""

SQL_COUNT_CONSENT_EVENTS_BY_USER = """
SELECT COUNT(*) AS count
FROM user_consent_ledger_events e
JOIN user_consent_ledger l ON l.consent_id = e.consent_id
WHERE l.user_id = %(user_id)s
"""

SQL_INSERT_DELETE_JOB = """
INSERT INTO me_delete_jobs (
  user_id,
  idempotency_key,
  requested_by_actor_id,
  scope,
  reason,
  status,
  soft_delete_window_days,
  hard_delete,
  summary
)
VALUES (
  %(user_id)s,
  %(idempotency_key)s,
  %(requested_by_actor_id)s,
  %(scope)s,
  %(reason)s,
  %(status)s,
  %(soft_delete_window_days)s,
  %(hard_delete)s,
  %(summary)s
)
RETURNING delete_request_id
"""

SQL_GET_DELETE_JOB_BY_IDEMPOTENCY = """
SELECT
  delete_request_id,
  status,
  requested_at,
  scope,
  reason,
  soft_delete_window_days,
  hard_delete,
  summary,
  proof,
  error_code,
  error_detail
FROM me_delete_jobs
WHERE user_id = %(user_id)s
  AND idempotency_key = %(idempotency_key)s
"""

SQL_GET_DELETE_JOB = """
SELECT
  delete_request_id,
  idempotency_key,
  status,
  requested_at,
  scope,
  reason,
  soft_delete_window_days,
  hard_delete,
  summary,
  proof,
  error_code,
  error_detail
FROM me_delete_jobs
WHERE delete_request_id = %(delete_request_id)s
  AND user_id = %(user_id)s
"""

SQL_REVOKE_ACTIVE_CONSENT = """
UPDATE user_consent_ledger
SET status = 'revoked',
    revoked_at_utc = NOW(),
    revocation_reason = %(revocation_reason)s,
    revocation_actor_id = %(revocation_actor_id)s,
    revocation_ip_cidr = %(revocation_ip_cidr)s,
    updated_at_utc = NOW(),
    updated_by_actor_id = %(updated_by_actor_id)s
WHERE user_id = %(user_id)s
  AND status = 'active'
"""

SQL_UPDATE_DELETE_JOB = """
UPDATE me_delete_jobs
SET status = %(status)s,
    summary = %(summary)s,
    proof = %(proof)s,
    error_code = %(error_code)s,
    error_detail = %(error_detail)s
WHERE delete_request_id = %(delete_request_id)s
"""

SQL_COUNT_CONSENT_RECORDS = """
SELECT COUNT(*) AS count
FROM user_consent_ledger
WHERE user_id = %(user_id)s
"""

SQL_DELETE_CONSENT_RECORDS = """
DELETE FROM user_consent_ledger
WHERE user_id = %(user_id)s
"""

SQL_DELETE_CONSENT_EVENTS = """
DELETE FROM user_consent_ledger_events
WHERE consent_id IN (SELECT consent_id FROM user_consent_ledger WHERE user_id = %(user_id)s)
"""

SQL_COUNT_QUEUE_ROWS = """
SELECT COUNT(*) AS count
FROM me_mutation_queue
WHERE user_id = %(user_id)s
"""

SQL_GET_LAST_QUEUE_HASH_FOR_DEVICE = """
SELECT chain_item_hash
FROM me_mutation_queue
WHERE user_id = %(user_id)s
  AND device_id = %(device_id)s
  AND replay_window_expires_at > NOW()
ORDER BY received_at DESC
LIMIT 1
"""

SQL_DELETE_QUEUE_ROWS = """
DELETE FROM me_mutation_queue
WHERE user_id = %(user_id)s
"""

SQL_DELETE_DEVICE_KEYS = """
DELETE FROM me_device_signing_keys
WHERE user_id = %(user_id)s
"""

SQL_DELETE_ENTITY_VERSIONS = """
DELETE FROM me_entity_versions
WHERE user_id = %(user_id)s
"""


def fetch_one(conn: Connection, query: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    cur = conn.execute(query, params)
    return cur.fetchone()


def fetch_all(conn: Connection, query: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    cur = conn.execute(query, params)
    return list(cur.fetchall())
