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
LEFT JOIN LATERAL (
  SELECT
    rr.overall_level,
    rr.driver_subtype_code,
    rr.coverage_ratio,
    rr.computed_at
  FROM v_phase3_rollups_latest_full rr
  WHERE rr.food_id = f.food_id
  ORDER BY rr.computed_at DESC
  LIMIT 1
) r ON TRUE
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
  f.food_slug ASC
LIMIT %(limit)s
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
FROM v_phase3_rollup_subtype_levels_latest v
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
WITH from_food AS (
  SELECT food_id
  FROM foods f
  WHERE f.food_slug = %(from_slug)s
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
  r.status::text AS rule_status,
  ff.food_slug AS from_food_slug,
  ft.food_slug AS to_food_slug,
  rs.fodmap_safety_score,
  rs.overall_score,
  rs.scoring_version,
  COALESCE(vrf.overall_level::text, 'unknown') AS from_overall_level,
  COALESCE(vrt.overall_level::text, 'unknown') AS to_overall_level,
  COALESCE(vrf.coverage_ratio, 0)::numeric(6,4) AS coverage_ratio,
  p_from.priority_rank AS from_priority_rank,
  p_to.priority_rank AS to_priority_rank,
  vf_from.burden_ratio AS from_burden_ratio,
  vf_to.burden_ratio AS to_burden_ratio
FROM foods ff
JOIN foods ft ON TRUE
JOIN swap_rules r ON r.from_food_id = ff.food_id AND r.to_food_id = ft.food_id
JOIN swap_rule_scores rs ON rs.swap_rule_id = r.swap_rule_id
LEFT JOIN phase2_priority_foods p_from ON p_from.resolved_food_id = r.from_food_id
LEFT JOIN phase2_priority_foods p_to ON p_to.resolved_food_id = r.to_food_id
LEFT JOIN v_phase3_rollups_latest_full vrf ON vrf.food_id = ff.food_id
LEFT JOIN v_phase3_rollups_latest_full vrt ON vrt.food_id = ft.food_id
LEFT JOIN v_phase3_rollup_subtype_levels_latest vf_from
  ON vf_from.food_id = ff.food_id
 AND vf_from.priority_rank = p_from.priority_rank
LEFT JOIN v_phase3_rollup_subtype_levels_latest vf_to
  ON vf_to.food_id = ft.food_id
 AND vf_to.priority_rank = p_to.priority_rank
WHERE ff.food_slug = %(from_food_slug)s
  AND ft.food_slug = %(to_food_slug)s
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
