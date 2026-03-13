BEGIN;

DELETE FROM food_safe_harbor_assignments
WHERE assignment_version = 'safe_harbor_v1';

ALTER TABLE food_safe_harbor_assignments
  DROP CONSTRAINT IF EXISTS food_safe_harbor_assignments_assignment_method_check;

ALTER TABLE food_safe_harbor_assignments
  ADD CONSTRAINT food_safe_harbor_assignments_assignment_method_check
  CHECK (assignment_method IN ('explicit_measurement_pack_v1'));

INSERT INTO safe_harbor_cohorts (
  cohort_code,
  label_fr,
  label_en,
  rationale_fr,
  rationale_en,
  caveat_fr,
  caveat_en,
  sort_order
) VALUES
  (
    'cohort_oil_fat',
    'Matières grasses simples',
    'Simple fats and oils',
    'Affichage limité aux huiles et graisses simples pour lesquelles Safe-Harbor V1 matérialise six mesures FODMAP à 0 à partir des signaux CIQUAL et des règles internes.',
    'Display is limited to simple oils and fats for which Safe-Harbor V1 materializes six zero FODMAP measurements from CIQUAL signals and internal rules.',
    'Formes simples uniquement. Les mélanges, huiles génériques, fritures, aromatisations, marinades et sauces sont exclus. Pour une huile infusée maison, conserver au réfrigérateur et jeter après 4 jours.',
    'Plain forms only. Blends, generic frying oils, flavored oils, marinades, and sauces are excluded. For homemade infused oil, refrigerate and discard after 4 days.',
    1
  ),
  (
    'cohort_plain_protein',
    'Protéines animales simples',
    'Simple animal proteins',
    'Affichage limité aux protéines animales simples pour lesquelles Safe-Harbor V1 matérialise six mesures FODMAP à 0 à partir des signaux CIQUAL et des règles internes.',
    'Display is limited to simple animal proteins for which Safe-Harbor V1 materializes six zero FODMAP measurements from CIQUAL signals and internal rules.',
    'Formes nature uniquement. La panure, les sauces, les marinades, la salaison et les assaisonnements peuvent changer la compatibilité.',
    'Plain forms only. Breading, sauces, marinades, curing, and seasoning can change compatibility.',
    2
  ),
  (
    'cohort_egg',
    'Oeufs simples',
    'Simple eggs',
    'Affichage limité aux oeufs simples pour lesquels Safe-Harbor V1 matérialise six mesures FODMAP à 0 à partir des signaux CIQUAL et des règles internes.',
    'Display is limited to simple eggs for which Safe-Harbor V1 materializes six zero FODMAP measurements from CIQUAL signals and internal rules.',
    'Formes simples uniquement. Les oeufs garnis, brouillés avec matière grasse ou préparés avec sauce, oignon ou ail sont exclus.',
    'Plain forms only. Filled eggs, scrambled eggs with added fat, and preparations with sauce, onion, or garlic are excluded.',
    3
  )
ON CONFLICT (cohort_code) DO UPDATE SET
  label_fr = EXCLUDED.label_fr,
  label_en = EXCLUDED.label_en,
  rationale_fr = EXCLUDED.rationale_fr,
  rationale_en = EXCLUDED.rationale_en,
  caveat_fr = EXCLUDED.caveat_fr,
  caveat_en = EXCLUDED.caveat_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sources WHERE source_slug = 'internal_rules_v1') THEN
    RAISE EXCEPTION 'required source missing: internal_rules_v1';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM sources WHERE source_slug = 'ciqual_2025') THEN
    RAISE EXCEPTION 'required source missing: ciqual_2025';
  END IF;
END $$;

DELETE FROM food_fodmap_measurements m
USING sources src
WHERE m.source_id = src.source_id
  AND src.source_slug = 'internal_rules_v1'
  AND m.notes LIKE 'safe_harbor_v1:composition_zero;%';

CREATE TEMP TABLE stg_safe_harbor_candidates (
  food_id UUID PRIMARY KEY,
  food_slug TEXT NOT NULL,
  ciqual_ref TEXT NOT NULL,
  cohort_code TEXT NOT NULL,
  notes TEXT NOT NULL
) ON COMMIT DROP;

WITH rank2_blocked AS (
  SELECT resolved_food_id AS food_id
  FROM phase2_priority_foods
  WHERE priority_rank = 2
),
ciqual_refs AS (
  SELECT
    fer.food_id,
    MIN(fer.ref_value) AS ciqual_ref
  FROM food_external_refs fer
  WHERE fer.ref_system = 'CIQUAL'
  GROUP BY fer.food_id
),
ciqual_nutrient_candidates AS (
  SELECT
    fno.food_id,
    nd.nutrient_code,
    fno.comparator,
    fno.amount_value,
    COALESCE(fno.observed_at, fno.effective_from) AS observed_on,
    ROW_NUMBER() OVER (
      PARTITION BY fno.food_id, nd.nutrient_code
      ORDER BY COALESCE(fno.observed_at, fno.effective_from) DESC, fno.created_at DESC, fno.observation_id DESC
    ) AS rn
  FROM food_nutrient_observations fno
  JOIN nutrient_definitions nd ON nd.nutrient_id = fno.nutrient_id
  JOIN sources s ON s.source_id = fno.source_id
  WHERE s.source_slug = 'ciqual_2025'
    AND nd.nutrient_code IN ('CIQUAL_32000', 'CIQUAL_32210', 'CIQUAL_32250', 'CIQUAL_32410', 'CIQUAL_34000')
    AND fno.basis = 'per_100g'
    AND fno.amount_value IS NOT NULL
),
ciqual_nutrient_latest AS (
  SELECT
    food_id,
    nutrient_code,
    comparator,
    amount_value,
    observed_on
  FROM ciqual_nutrient_candidates
  WHERE rn = 1
),
ciqual_zero_pack_basis AS (
  SELECT
    f.food_id,
    f.food_slug,
    f.canonical_name_fr,
    cr.ciqual_ref
  FROM foods f
  JOIN ciqual_refs cr ON cr.food_id = f.food_id
  LEFT JOIN ciqual_nutrient_latest nl ON nl.food_id = f.food_id
  GROUP BY f.food_id, f.food_slug, f.canonical_name_fr, cr.ciqual_ref
  HAVING COUNT(*) FILTER (
    WHERE nl.nutrient_code = 'CIQUAL_32000'
      AND nl.comparator = 'eq'
      AND nl.amount_value = 0
  ) = 1
     AND COUNT(*) FILTER (
       WHERE nl.nutrient_code = 'CIQUAL_32210'
         AND nl.comparator = 'eq'
         AND nl.amount_value = 0
     ) = 1
     AND COUNT(*) FILTER (
       WHERE nl.nutrient_code = 'CIQUAL_32250'
         AND nl.comparator = 'eq'
         AND nl.amount_value = 0
     ) = 1
     AND COUNT(*) FILTER (
       WHERE nl.nutrient_code = 'CIQUAL_32410'
         AND nl.comparator = 'eq'
         AND nl.amount_value = 0
     ) = 1
     AND COUNT(*) FILTER (
       WHERE nl.nutrient_code = 'CIQUAL_34000'
         AND nl.comparator = 'eq'
         AND nl.amount_value = 0
     ) = 1
),
oil_candidates AS (
  SELECT DISTINCT
    z.food_id,
    z.food_slug,
    z.ciqual_ref,
    'cohort_oil_fat'::text AS cohort_code,
    'safe_harbor_v1:composition_zero;cohort=cohort_oil_fat;gate:ciqual_zero_nutrient_pack=1;gate:single_ingredient=1;gate:ambiguous_identity=0;gate:processing_risk=0'::text AS notes
  FROM ciqual_zero_pack_basis z
  JOIN foods f ON f.food_id = z.food_id
  JOIN food_category_memberships fcm ON fcm.food_id = f.food_id
  JOIN food_categories fc ON fc.category_id = fcm.category_id
  LEFT JOIN rank2_blocked r2 ON r2.food_id = f.food_id
  WHERE r2.food_id IS NULL
    AND (
      fc.code IN ('ciqual_ssgrp_0902', 'ciqual_ssgrp_0904', 'ciqual_ssgrp_0905')
      OR f.food_slug = 'huile-de-beurre-ou-beurre-concentre'
    )
    AND NOT (
      COALESCE(lower(f.canonical_name_fr), '') LIKE ANY (
        ARRAY[
          '%margarine%',
          '%allégé%',
          '%allege%',
          '%léger%',
          '%leger%',
          '%à tartiner%',
          '%a tartiner%',
          '%sans précision%',
          '%sans precision%',
          '%aliment moyen%',
          '%mélange%',
          '%melange%',
          '%combinée%',
          '%combinee%',
          '%pour friture%',
          '%à frire%',
          '%a frire%'
        ]
      )
      OR COALESCE(lower(f.canonical_name_fr), '') ~ '^huile ou '
      OR COALESCE(lower(f.canonical_name_fr), '') ~ '^mati[èe]re grasse ou '
    )
),
plain_protein_candidates AS (
  SELECT DISTINCT
    z.food_id,
    z.food_slug,
    z.ciqual_ref,
    'cohort_plain_protein'::text AS cohort_code,
    'safe_harbor_v1:composition_zero;cohort=cohort_plain_protein;gate:ciqual_zero_nutrient_pack=1;gate:single_ingredient=1;gate:ambiguous_identity=0;gate:processing_risk=0'::text AS notes
  FROM ciqual_zero_pack_basis z
  JOIN foods f ON f.food_id = z.food_id
  JOIN food_category_memberships fcm ON fcm.food_id = f.food_id
  JOIN food_categories fc ON fc.category_id = fcm.category_id
  LEFT JOIN rank2_blocked r2 ON r2.food_id = f.food_id
  WHERE r2.food_id IS NULL
    AND fc.code IN ('ciqual_ssgrp_0402', 'ciqual_ssgrp_0406', 'ciqual_ssgrp_0408')
    AND NOT (
      COALESCE(lower(f.canonical_name_fr), '') LIKE ANY (
        ARRAY[
          '%marin%',
          '%sauce%',
          '%pané%',
          '%pane%',
          '%assais%',
          '%season%',
          '%charcut%',
          '%sausage%',
          '%saucisse%',
          '%bacon%',
          '%jambon%',
          '%ham%',
          '%fum%',
          '%smok%',
          '%prepared%',
          '%nugget%',
          '%burger%',
          '%frit%',
          '%friture%',
          '%frite%',
          '%salé%',
          '%sale%',
          '%court-bouillon%',
          '%étouffée%',
          '%etouffee%',
          '%semi-conserve%',
          '%conserve%',
          '%panure%',
          '%sans précision%',
          '%sans precision%',
          '%aliment moyen%',
          '%mélange%',
          '%melange%'
        ]
      )
    )
),
egg_candidates AS (
  SELECT DISTINCT
    z.food_id,
    z.food_slug,
    z.ciqual_ref,
    'cohort_egg'::text AS cohort_code,
    'safe_harbor_v1:composition_zero;cohort=cohort_egg;gate:ciqual_zero_nutrient_pack=1;gate:single_ingredient=1;gate:ambiguous_identity=0;gate:processing_risk=0'::text AS notes
  FROM ciqual_zero_pack_basis z
  JOIN foods f ON f.food_id = z.food_id
  JOIN food_category_memberships fcm ON fcm.food_id = f.food_id
  JOIN food_categories fc ON fc.category_id = fcm.category_id
  LEFT JOIN rank2_blocked r2 ON r2.food_id = f.food_id
  WHERE r2.food_id IS NULL
    AND fc.code IN ('ciqual_ssssgrp_041001', 'ciqual_ssssgrp_041002')
    AND NOT (
      COALESCE(lower(f.canonical_name_fr), '') LIKE ANY (
        ARRAY[
          '%poudre%',
          '%omelette%',
          '%jambon%',
          '%lardon%',
          '%fromage%',
          '%ciboulette%',
          '%champignon%',
          '%oignon%',
          '%sauce%',
          '%garniture%',
          '%avec matière grasse%',
          '%avec matiere grasse%',
          '%sans précision%',
          '%sans precision%',
          '%aliment moyen%',
          '%mélange%',
          '%melange%'
        ]
      )
    )
),
all_candidates AS (
  SELECT * FROM oil_candidates
  UNION ALL
  SELECT * FROM plain_protein_candidates
  UNION ALL
  SELECT * FROM egg_candidates
)
INSERT INTO stg_safe_harbor_candidates (food_id, food_slug, ciqual_ref, cohort_code, notes)
SELECT food_id, food_slug, ciqual_ref, cohort_code, notes
FROM all_candidates;

WITH rule_source AS (
  SELECT source_id
  FROM sources
  WHERE source_slug = 'internal_rules_v1'
),
subtype_specs AS (
  SELECT *
  FROM (
    VALUES
      ('fructan', 'expert_estimate', 'inferred', 0.900::NUMERIC(4,3)),
      ('gos', 'expert_estimate', 'inferred', 0.900::NUMERIC(4,3)),
      ('fructose', 'derived_from_nutrient', 'inferred', 0.950::NUMERIC(4,3)),
      ('lactose', 'derived_from_nutrient', 'inferred', 0.950::NUMERIC(4,3)),
      ('sorbitol', 'derived_from_nutrient', 'inferred', 0.950::NUMERIC(4,3)),
      ('mannitol', 'derived_from_nutrient', 'inferred', 0.950::NUMERIC(4,3))
  ) AS v(subtype_code, method, evidence_tier, confidence_score)
)
INSERT INTO food_fodmap_measurements (
  food_id,
  fodmap_subtype_id,
  source_id,
  source_record_ref,
  amount_raw,
  comparator,
  amount_g_per_100g,
  amount_g_per_serving,
  serving_g,
  method,
  evidence_tier,
  confidence_score,
  observed_at,
  is_current,
  notes
)
SELECT
  c.food_id,
  fs.fodmap_subtype_id,
  rs.source_id,
  format(
    'safe_harbor_v1|ciqual_ref=%s|cohort=%s|subtype=%s|basis=ciqual_zero_nutrient_pack_v1',
    c.ciqual_ref,
    c.cohort_code,
    s.subtype_code
  ),
  '0' AS amount_raw,
  'eq'::comparator_code AS comparator,
  0::NUMERIC(12,6) AS amount_g_per_100g,
  0::NUMERIC(12,6) AS amount_g_per_serving,
  100::NUMERIC(8,2) AS serving_g,
  s.method,
  s.evidence_tier::evidence_tier,
  s.confidence_score,
  DATE '2026-03-13' AS observed_at,
  TRUE AS is_current,
  c.notes || format(';subtype=%s', s.subtype_code)
FROM stg_safe_harbor_candidates c
CROSS JOIN subtype_specs s
JOIN fodmap_subtypes fs ON fs.code = s.subtype_code
CROSS JOIN rule_source rs;

WITH rule_source AS (
  SELECT source_id
  FROM sources
  WHERE source_slug = 'internal_rules_v1'
),
data_source AS (
  SELECT source_id
  FROM sources
  WHERE source_slug = 'ciqual_2025'
),
explicit_zero_packs AS (
  SELECT
    m.food_id
  FROM food_fodmap_measurements m
  JOIN sources src ON src.source_id = m.source_id
  JOIN fodmap_subtypes fs ON fs.fodmap_subtype_id = m.fodmap_subtype_id
  WHERE src.source_slug = 'internal_rules_v1'
    AND m.is_current = TRUE
    AND m.notes LIKE 'safe_harbor_v1:composition_zero;%'
    AND m.comparator = 'eq'
    AND m.amount_g_per_100g = 0
    AND m.amount_g_per_serving = 0
  GROUP BY m.food_id
  HAVING COUNT(DISTINCT fs.code) = 6
)
INSERT INTO food_safe_harbor_assignments (
  food_id,
  cohort_code,
  rule_source_id,
  data_source_id,
  assignment_version,
  assignment_method,
  notes
)
SELECT
  c.food_id,
  c.cohort_code,
  rs.source_id,
  ds.source_id,
  'safe_harbor_v1' AS assignment_version,
  'explicit_measurement_pack_v1' AS assignment_method,
  c.notes || ';assignment_basis=6x_zero_measurement_pack'
FROM stg_safe_harbor_candidates c
JOIN explicit_zero_packs p ON p.food_id = c.food_id
CROSS JOIN rule_source rs
CROSS JOIN data_source ds;

COMMIT;
