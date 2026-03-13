BEGIN;

DO $$
DECLARE
  cohort_count INTEGER;
  assignment_count INTEGER;
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO cohort_count
  FROM safe_harbor_cohorts
  WHERE cohort_code IN ('cohort_oil_fat', 'cohort_plain_protein', 'cohort_egg');

  IF cohort_count <> 3 THEN
    RAISE EXCEPTION 'safe_harbor_v1 requires 3 cohort metadata rows, got %', cohort_count;
  END IF;

  SELECT COUNT(*) INTO assignment_count
  FROM food_safe_harbor_assignments
  WHERE assignment_version = 'safe_harbor_v1';

  SELECT COUNT(*) INTO bad_count
  FROM food_safe_harbor_assignments a
  LEFT JOIN safe_harbor_cohorts c ON c.cohort_code = a.cohort_code
  WHERE a.assignment_version = 'safe_harbor_v1'
    AND (
      c.cohort_code IS NULL
      OR a.assignment_method <> 'explicit_measurement_pack_v1'
      OR a.rule_source_id <> (SELECT source_id FROM sources WHERE source_slug = 'internal_rules_v1')
      OR a.data_source_id <> (SELECT source_id FROM sources WHERE source_slug = 'ciqual_2025')
      OR a.notes NOT LIKE 'safe_harbor_v1:composition_zero;%'
      OR a.notes NOT LIKE '%assignment_basis=6x_zero_measurement_pack%'
    );

  IF bad_count <> 0 THEN
    RAISE EXCEPTION 'safe_harbor_v1 source, cohort, or assignment-method contract violated (% rows)', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM food_safe_harbor_assignments a
  LEFT JOIN food_external_refs fer
    ON fer.food_id = a.food_id
   AND fer.ref_system = 'CIQUAL'
  WHERE a.assignment_version = 'safe_harbor_v1'
    AND fer.food_id IS NULL;

  IF bad_count <> 0 THEN
    RAISE EXCEPTION 'safe_harbor_v1 contains assignments without CIQUAL linkage (% rows)', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM food_safe_harbor_assignments a
  JOIN phase2_priority_foods p ON p.resolved_food_id = a.food_id
  WHERE a.assignment_version = 'safe_harbor_v1'
    AND p.priority_rank = 2;

  IF bad_count <> 0 THEN
    RAISE EXCEPTION 'safe_harbor_v1 illegally includes rank 2 (% rows)', bad_count;
  END IF;
END $$;

DO $$
DECLARE
  assignment_count INTEGER;
  pack_food_count INTEGER;
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO assignment_count
  FROM food_safe_harbor_assignments
  WHERE assignment_version = 'safe_harbor_v1';

  -- Reduced CI seed environments may legitimately yield zero promotable rows.
  IF assignment_count = 0 THEN
    RETURN;
  END IF;

  SELECT COUNT(*) INTO pack_food_count
  FROM (
    SELECT m.food_id
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
  ) packs;

  IF assignment_count <> pack_food_count THEN
    RAISE EXCEPTION 'safe_harbor_v1 assignment count (%) must equal explicit zero-pack count (%)', assignment_count, pack_food_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT
      a.food_id,
      COUNT(DISTINCT fs.code) FILTER (
        WHERE m.is_current = TRUE
          AND m.comparator = 'eq'
          AND m.amount_g_per_100g = 0
          AND m.amount_g_per_serving = 0
          AND m.notes LIKE 'safe_harbor_v1:composition_zero;%'
      ) AS subtype_count
    FROM food_safe_harbor_assignments a
    LEFT JOIN food_fodmap_measurements m ON m.food_id = a.food_id
    LEFT JOIN fodmap_subtypes fs ON fs.fodmap_subtype_id = m.fodmap_subtype_id
    LEFT JOIN sources src ON src.source_id = m.source_id
    WHERE a.assignment_version = 'safe_harbor_v1'
      AND src.source_slug = 'internal_rules_v1'
    GROUP BY a.food_id
  ) pack_counts
  WHERE subtype_count <> 6;

  IF bad_count <> 0 THEN
    RAISE EXCEPTION 'safe_harbor_v1 assignments missing full 6-subtype zero packs (% rows)', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM food_safe_harbor_assignments a
  JOIN food_fodmap_measurements m ON m.food_id = a.food_id
  JOIN fodmap_subtypes fs ON fs.fodmap_subtype_id = m.fodmap_subtype_id
  JOIN sources src ON src.source_id = m.source_id
  WHERE a.assignment_version = 'safe_harbor_v1'
    AND src.source_slug = 'internal_rules_v1'
    AND m.notes LIKE 'safe_harbor_v1:composition_zero;%'
    AND (
      (fs.code IN ('fructan', 'gos') AND m.method <> 'expert_estimate')
      OR (fs.code IN ('fructose', 'lactose', 'sorbitol', 'mannitol') AND m.method <> 'derived_from_nutrient')
      OR m.comparator <> 'eq'
      OR m.amount_g_per_100g <> 0
      OR m.amount_g_per_serving <> 0
    );

  IF bad_count <> 0 THEN
    RAISE EXCEPTION 'safe_harbor_v1 measurement-pack subtype method or zero-value contract violated (% rows)', bad_count;
  END IF;
END $$;

DO $$
DECLARE
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count
  FROM (
    WITH ciqual_nutrient_candidates AS (
      SELECT
        fno.food_id,
        nd.nutrient_code,
        fno.comparator,
        fno.amount_value,
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
        amount_value
      FROM ciqual_nutrient_candidates
      WHERE rn = 1
    )
    SELECT
      a.food_id,
      COUNT(*) FILTER (
        WHERE nl.nutrient_code = 'CIQUAL_32000'
          AND nl.comparator = 'eq'
          AND nl.amount_value = 0
      ) AS sugar_zero_count,
      COUNT(*) FILTER (
        WHERE nl.nutrient_code = 'CIQUAL_32210'
          AND nl.comparator = 'eq'
          AND nl.amount_value = 0
      ) AS fructose_zero_count,
      COUNT(*) FILTER (
        WHERE nl.nutrient_code = 'CIQUAL_32250'
          AND nl.comparator = 'eq'
          AND nl.amount_value = 0
      ) AS glucose_zero_count,
      COUNT(*) FILTER (
        WHERE nl.nutrient_code = 'CIQUAL_32410'
          AND nl.comparator = 'eq'
          AND nl.amount_value = 0
      ) AS lactose_zero_count,
      COUNT(*) FILTER (
        WHERE nl.nutrient_code = 'CIQUAL_34000'
          AND nl.comparator = 'eq'
          AND nl.amount_value = 0
      ) AS polyols_zero_count
    FROM food_safe_harbor_assignments a
    LEFT JOIN ciqual_nutrient_latest nl ON nl.food_id = a.food_id
    WHERE a.assignment_version = 'safe_harbor_v1'
    GROUP BY a.food_id
  ) nutrient_basis
  WHERE sugar_zero_count <> 1
     OR fructose_zero_count <> 1
     OR glucose_zero_count <> 1
     OR lactose_zero_count <> 1
     OR polyols_zero_count <> 1;

  IF bad_count <> 0 THEN
    RAISE EXCEPTION 'safe_harbor_v1 contains assignments without full CIQUAL zero-nutrient basis (% rows)', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM food_safe_harbor_assignments a
  JOIN foods f ON f.food_id = a.food_id
  WHERE a.assignment_version = 'safe_harbor_v1'
    AND a.cohort_code = 'cohort_oil_fat'
    AND (
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
    );

  IF bad_count <> 0 THEN
    RAISE EXCEPTION 'safe_harbor_v1 oil identity screen failed (% rows)', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM food_safe_harbor_assignments a
  JOIN foods f ON f.food_id = a.food_id
  WHERE a.assignment_version = 'safe_harbor_v1'
    AND a.cohort_code = 'cohort_plain_protein'
    AND COALESCE(lower(f.canonical_name_fr), '') LIKE ANY (
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
    );

  IF bad_count <> 0 THEN
    RAISE EXCEPTION 'safe_harbor_v1 protein processing screen failed (% rows)', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM food_safe_harbor_assignments a
  JOIN foods f ON f.food_id = a.food_id
  WHERE a.assignment_version = 'safe_harbor_v1'
    AND a.cohort_code = 'cohort_egg'
    AND COALESCE(lower(f.canonical_name_fr), '') LIKE ANY (
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
    );

  IF bad_count <> 0 THEN
    RAISE EXCEPTION 'safe_harbor_v1 egg processing screen failed (% rows)', bad_count;
  END IF;
END $$;

COMMIT;
