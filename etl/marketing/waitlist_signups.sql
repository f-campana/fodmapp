-- Run with:
-- psql "$MARKETING_DB_URL" -f etl/marketing/waitlist_signups.sql

CREATE TABLE IF NOT EXISTS waitlist_signups (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email                 TEXT NOT NULL,
    locale                TEXT NOT NULL DEFAULT 'fr'
                          CHECK (locale IN ('fr', 'en')),
    source                TEXT NOT NULL DEFAULT 'landing-page',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmation_sent_at  TIMESTAMPTZ,
    CONSTRAINT waitlist_signups_email_unique UNIQUE (email)
);

COMMENT ON TABLE waitlist_signups IS
  'Pre-launch waitlist captures from marketing site.';

CREATE INDEX IF NOT EXISTS idx_waitlist_signups_created
    ON waitlist_signups (created_at DESC);
