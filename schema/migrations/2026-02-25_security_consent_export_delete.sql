BEGIN;

CREATE TABLE IF NOT EXISTS user_consent_ledger (
  consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_subject_id TEXT,
  tenant_scope TEXT NOT NULL DEFAULT 'fodmap_app',

  policy_version TEXT NOT NULL,
  legal_basis TEXT NOT NULL CHECK (
    legal_basis IN ('consent', 'contract', 'legal_obligation', 'vital_interests', 'public_interest', 'legitimate_interests')
  ),
  consent_scope JSONB NOT NULL,
  consent_method TEXT NOT NULL CHECK (
    consent_method IN ('explicit_checkbox', 'oauth_consent', 'in_app_sheet', 'api_admin', 'offline_cache_reconsent')
  ),
  source TEXT NOT NULL CHECK (source IN ('mobile_app', 'web_fallback', 'support', 'api_internal')),
  source_ref TEXT,

  granted_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at_utc TIMESTAMPTZ,
  expires_at_utc TIMESTAMPTZ,

  policy_fingerprint TEXT NOT NULL,
  scope_signature TEXT NOT NULL,
  evidence_uri TEXT,
  evidence_hash TEXT,

  revocation_reason TEXT,
  revocation_actor_id UUID,
  revocation_ip_cidr INET,

  status TEXT NOT NULL CHECK (
    status IN ('active', 'revoked', 'expired', 'superseded', 'invalidated')
  ),
  parent_consent_id UUID REFERENCES user_consent_ledger(consent_id),
  replaced_by_consent_id UUID REFERENCES user_consent_ledger(consent_id),

  created_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_actor_id UUID,
  updated_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by_actor_id UUID
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_consent_active
  ON user_consent_ledger (user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS ix_user_consent_user_status
  ON user_consent_ledger (user_id, status, granted_at_utc DESC);

CREATE INDEX IF NOT EXISTS ix_user_consent_device_subject
  ON user_consent_ledger (device_subject_id, status);

CREATE TABLE IF NOT EXISTS user_consent_ledger_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id UUID NOT NULL REFERENCES user_consent_ledger(consent_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_type TEXT,
  actor_id UUID,
  at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  event_hash TEXT NOT NULL,
  prev_hash TEXT
);

CREATE INDEX IF NOT EXISTS ix_consent_events_consent
  ON user_consent_ledger_events (consent_id, at_utc DESC);

CREATE TABLE IF NOT EXISTS me_device_signing_keys (
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  key_id TEXT NOT NULL,
  secret_b64 TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'hmac-sha256',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'suspended')),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_actor_id UUID,
  PRIMARY KEY (device_id, key_id)
);

CREATE TABLE IF NOT EXISTS me_mutation_queue (
  mutation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL,
  queue_item_id UUID NOT NULL,
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  app_install_id TEXT NOT NULL,
  op TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  client_seq BIGINT NOT NULL,
  base_version BIGINT,
  payload_hash TEXT NOT NULL,
  aad JSONB NOT NULL DEFAULT '{}'::JSONB,
  envelope_json JSONB NOT NULL,
  signature_algorithm TEXT NOT NULL DEFAULT 'hmac-sha256',
  signature_kid TEXT NOT NULL,
  signature TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('accepted', 'duplicate', 'conflict', 'replayed', 'rejected', 'error')
  ) DEFAULT 'accepted',
  error_code TEXT,
  error_detail TEXT,
  replay_window_expires_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE me_mutation_queue
  ADD COLUMN IF NOT EXISTS chain_prev_hash TEXT;

ALTER TABLE me_mutation_queue
  ADD COLUMN IF NOT EXISTS chain_item_hash TEXT;

CREATE INDEX IF NOT EXISTS ix_mutation_queue_chain
  ON me_mutation_queue (user_id, device_id, chain_item_hash);

CREATE UNIQUE INDEX IF NOT EXISTS uq_mutation_idempotency_user
  ON me_mutation_queue (user_id, idempotency_key);

CREATE INDEX IF NOT EXISTS ix_mutation_device_status
  ON me_mutation_queue (device_id, status, received_at DESC);

CREATE TABLE IF NOT EXISTS me_entity_versions (
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  current_version BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS me_export_jobs (
  export_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  idempotency_key TEXT,
  requested_by_actor_id UUID,
  status TEXT NOT NULL CHECK (
    status IN ('accepted', 'queued', 'processing', 'ready', 'ready_with_redactions', 'failed', 'completed')
  ) NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  requested_scope JSONB NOT NULL,
  include_domain TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  rows_by_domain JSONB NOT NULL DEFAULT '{}'::JSONB,
  redactions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  manifest JSONB,
  proof JSONB,
  download_url TEXT,
  error_code TEXT,
  error_detail TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day')
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_export_idempotent
  ON me_export_jobs (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_export_jobs_user_status
  ON me_export_jobs (user_id, status, requested_at DESC);

CREATE TABLE IF NOT EXISTS me_delete_jobs (
  delete_request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  idempotency_key TEXT,
  requested_by_actor_id UUID,
  scope TEXT NOT NULL CHECK (scope IN ('all', 'symptoms_only', 'diet_only', 'analytics_only')),
  reason TEXT,
  status TEXT NOT NULL CHECK (
    status IN ('accepted', 'queued', 'processing', 'completed', 'partial', 'failed')
  ) NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  soft_delete_window_days INTEGER,
  hard_delete BOOLEAN NOT NULL DEFAULT TRUE,
  summary JSONB,
  proof JSONB,
  error_code TEXT,
  error_detail TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_delete_idempotent
  ON me_delete_jobs (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_delete_jobs_user_status
  ON me_delete_jobs (user_id, status, requested_at DESC);

COMMIT;
