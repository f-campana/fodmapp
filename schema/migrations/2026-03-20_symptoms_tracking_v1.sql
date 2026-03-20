BEGIN;

CREATE TABLE IF NOT EXISTS symptom_logs (
  symptom_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  symptom_type TEXT NOT NULL CHECK (
    symptom_type IN (
      'bloating',
      'pain',
      'gas',
      'diarrhea',
      'constipation',
      'nausea',
      'reflux',
      'other'
    )
  ),
  severity SMALLINT NOT NULL CHECK (severity BETWEEN 0 AND 10),
  noted_at_utc TIMESTAMPTZ NOT NULL,
  note TEXT,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_symptom_logs_user_time
  ON symptom_logs (user_id, deleted_at, noted_at_utc DESC);

CREATE TABLE IF NOT EXISTS custom_foods (
  custom_food_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  note TEXT,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_custom_foods_user_updated
  ON custom_foods (user_id, deleted_at, updated_at_utc DESC);

CREATE TABLE IF NOT EXISTS meal_logs (
  meal_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  occurred_at_utc TIMESTAMPTZ NOT NULL,
  note TEXT,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_meal_logs_user_time
  ON meal_logs (user_id, deleted_at, occurred_at_utc DESC);

CREATE TABLE IF NOT EXISTS meal_log_items (
  meal_log_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_log_id UUID NOT NULL REFERENCES meal_logs (meal_log_id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  item_kind TEXT NOT NULL CHECK (item_kind IN ('canonical_food', 'custom_food', 'free_text')),
  food_id UUID REFERENCES foods (food_id),
  food_slug_snapshot TEXT,
  custom_food_id UUID,
  free_text_label TEXT,
  label_snapshot TEXT NOT NULL,
  quantity_text TEXT,
  note TEXT,
  CHECK (
    (item_kind = 'canonical_food' AND food_id IS NOT NULL AND food_slug_snapshot IS NOT NULL AND custom_food_id IS NULL AND free_text_label IS NULL)
    OR
    (item_kind = 'custom_food' AND food_id IS NULL AND food_slug_snapshot IS NULL AND custom_food_id IS NOT NULL AND free_text_label IS NULL)
    OR
    (item_kind = 'free_text' AND food_id IS NULL AND food_slug_snapshot IS NULL AND custom_food_id IS NULL AND free_text_label IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_meal_log_items_parent_sort
  ON meal_log_items (meal_log_id, sort_order);

CREATE TABLE IF NOT EXISTS saved_meals (
  saved_meal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  note TEXT,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_saved_meals_user_updated
  ON saved_meals (user_id, deleted_at, updated_at_utc DESC);

CREATE TABLE IF NOT EXISTS saved_meal_items (
  saved_meal_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_meal_id UUID NOT NULL REFERENCES saved_meals (saved_meal_id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  item_kind TEXT NOT NULL CHECK (item_kind IN ('canonical_food', 'custom_food', 'free_text')),
  food_id UUID REFERENCES foods (food_id),
  food_slug_snapshot TEXT,
  custom_food_id UUID,
  free_text_label TEXT,
  label_snapshot TEXT NOT NULL,
  quantity_text TEXT,
  note TEXT,
  CHECK (
    (item_kind = 'canonical_food' AND food_id IS NOT NULL AND food_slug_snapshot IS NOT NULL AND custom_food_id IS NULL AND free_text_label IS NULL)
    OR
    (item_kind = 'custom_food' AND food_id IS NULL AND food_slug_snapshot IS NULL AND custom_food_id IS NOT NULL AND free_text_label IS NULL)
    OR
    (item_kind = 'free_text' AND food_id IS NULL AND food_slug_snapshot IS NULL AND custom_food_id IS NULL AND free_text_label IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_meal_items_parent_sort
  ON saved_meal_items (saved_meal_id, sort_order);

COMMIT;
