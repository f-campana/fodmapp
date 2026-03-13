BEGIN;

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
    'Aliments retenus quand les données CIQUAL et les règles internes indiquent une matrice très pauvre en glucides fermentescibles.',
    'Included when CIQUAL data and internal rules indicate a matrix that is very low in fermentable carbohydrate.',
    'Formes simples uniquement. Les marinades, sauces et ajouts aromatiques peuvent changer la compatibilité. Pour une huile infusée maison, conserver au réfrigérateur et jeter après 4 jours.',
    'Plain forms only. Marinades, sauces, and aromatic additions can change compatibility. For homemade infused oils, refrigerate and discard after 4 days.',
    1
  ),
  (
    'cohort_plain_protein',
    'Protéines animales simples',
    'Simple animal proteins',
    'Aliments retenus quand les données CIQUAL et les règles internes indiquent une base animale simple, sans ingrédients riches en glucides fermentescibles ajoutés.',
    'Included when CIQUAL data and internal rules indicate a simple animal-food base without added fermentable-carbohydrate ingredients.',
    'Formes nature uniquement. La panure, les sauces, les marinades, la salaison et les assaisonnements peuvent changer la compatibilité.',
    'Plain forms only. Breading, sauces, marinades, curing, and seasoning can change compatibility.',
    2
  ),
  (
    'cohort_egg',
    'Œufs simples',
    'Simple eggs',
    'Aliments retenus quand les données CIQUAL et les règles internes indiquent des œufs ou parties d''œufs sans garniture complexe.',
    'Included when CIQUAL data and internal rules indicate eggs or egg components without complex added fillings.',
    'Formes simples uniquement. Les omelettes garnies, poudres composées et préparations avec ajout d''oignon, d''ail ou de sauce ne sont pas incluses.',
    'Plain forms only. Filled omelets, compound powders, and preparations with added onion, garlic, or sauces are not included.',
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

DELETE FROM food_safe_harbor_assignments
WHERE assignment_version = 'safe_harbor_v1';

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
rank2_blocked AS (
  SELECT resolved_food_id AS food_id
  FROM phase2_priority_foods
  WHERE priority_rank = 2
),
ciqual_linked_foods AS (
  SELECT DISTINCT fer.food_id
  FROM food_external_refs fer
  WHERE fer.ref_system = 'CIQUAL'
),
oil_candidates AS (
  SELECT DISTINCT
    f.food_id,
    'cohort_oil_fat'::text AS cohort_code,
    'safe_harbor_v1:cohort_oil_fat;gate=ciqual_category_gate_v1;gate=processing_screen'::text AS notes
  FROM foods f
  JOIN ciqual_linked_foods clf ON clf.food_id = f.food_id
  JOIN food_category_memberships fcm ON fcm.food_id = f.food_id
  JOIN food_categories fc ON fc.category_id = fcm.category_id
  LEFT JOIN rank2_blocked r2 ON r2.food_id = f.food_id
  WHERE r2.food_id IS NULL
    AND f.canonical_name_fr IS NOT NULL
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
          '%a tartiner%'
        ]
      )
    )
),
plain_protein_candidates AS (
  SELECT DISTINCT
    f.food_id,
    'cohort_plain_protein'::text AS cohort_code,
    'safe_harbor_v1:cohort_plain_protein;gate=ciqual_category_gate_v1;gate=processing_screen'::text AS notes
  FROM foods f
  JOIN ciqual_linked_foods clf ON clf.food_id = f.food_id
  JOIN food_category_memberships fcm ON fcm.food_id = f.food_id
  JOIN food_categories fc ON fc.category_id = fcm.category_id
  LEFT JOIN rank2_blocked r2 ON r2.food_id = f.food_id
  WHERE r2.food_id IS NULL
    AND f.canonical_name_fr IS NOT NULL
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
          '%panure%'
        ]
      )
    )
),
egg_candidates AS (
  SELECT DISTINCT
    f.food_id,
    'cohort_egg'::text AS cohort_code,
    'safe_harbor_v1:cohort_egg;gate=ciqual_category_gate_v1;gate=processing_screen'::text AS notes
  FROM foods f
  JOIN ciqual_linked_foods clf ON clf.food_id = f.food_id
  JOIN food_category_memberships fcm ON fcm.food_id = f.food_id
  JOIN food_categories fc ON fc.category_id = fcm.category_id
  LEFT JOIN rank2_blocked r2 ON r2.food_id = f.food_id
  WHERE r2.food_id IS NULL
    AND f.canonical_name_fr IS NOT NULL
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
          '%garniture%'
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
  'ciqual_category_gate_v1' AS assignment_method,
  c.notes
FROM all_candidates c
CROSS JOIN rule_source rs
CROSS JOIN data_source ds;

COMMIT;
