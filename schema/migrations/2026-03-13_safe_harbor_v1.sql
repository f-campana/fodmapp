BEGIN;

CREATE TABLE IF NOT EXISTS safe_harbor_cohorts (
  cohort_code TEXT PRIMARY KEY CHECK (
    cohort_code IN ('cohort_oil_fat', 'cohort_plain_protein', 'cohort_egg')
  ),
  label_fr TEXT NOT NULL,
  label_en TEXT NOT NULL,
  rationale_fr TEXT NOT NULL,
  rationale_en TEXT NOT NULL,
  caveat_fr TEXT NOT NULL,
  caveat_en TEXT NOT NULL,
  sort_order SMALLINT NOT NULL CHECK (sort_order >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS food_safe_harbor_assignments (
  food_id UUID PRIMARY KEY REFERENCES foods (food_id) ON DELETE CASCADE,
  cohort_code TEXT NOT NULL REFERENCES safe_harbor_cohorts (cohort_code),
  rule_source_id UUID NOT NULL REFERENCES sources (source_id),
  data_source_id UUID NOT NULL REFERENCES sources (source_id),
  assignment_version TEXT NOT NULL,
  assignment_method TEXT NOT NULL CHECK (assignment_method IN ('explicit_measurement_pack_v1')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (length(trim(assignment_version)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_food_safe_harbor_assignments_cohort
  ON food_safe_harbor_assignments (cohort_code, updated_at DESC, food_id);

CREATE INDEX IF NOT EXISTS idx_food_safe_harbor_assignments_data_source
  ON food_safe_harbor_assignments (data_source_id, rule_source_id);

COMMIT;
