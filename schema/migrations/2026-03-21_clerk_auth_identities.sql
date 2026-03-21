BEGIN;

CREATE TABLE IF NOT EXISTS me_auth_identities (
  user_id UUID PRIMARY KEY,
  auth_provider TEXT NOT NULL CHECK (auth_provider = 'clerk'),
  auth_subject TEXT NOT NULL,
  created_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_authenticated_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_me_auth_identities_provider_subject UNIQUE (auth_provider, auth_subject)
);

COMMIT;
