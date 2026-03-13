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

  IF assignment_count = 0 THEN
    RAISE EXCEPTION 'safe_harbor_v1 must create at least one assignment';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM food_safe_harbor_assignments a
  LEFT JOIN safe_harbor_cohorts c ON c.cohort_code = a.cohort_code
  WHERE a.assignment_version = 'safe_harbor_v1'
    AND (
      c.cohort_code IS NULL
      OR a.assignment_method <> 'ciqual_category_gate_v1'
      OR a.rule_source_id <> (SELECT source_id FROM sources WHERE source_slug = 'internal_rules_v1')
      OR a.data_source_id <> (SELECT source_id FROM sources WHERE source_slug = 'ciqual_2025')
    );

  IF bad_count <> 0 THEN
    RAISE EXCEPTION 'safe_harbor_v1 source or cohort contract violated (% rows)', bad_count;
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
  oil_count INTEGER;
  protein_count INTEGER;
  egg_count INTEGER;
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO oil_count
  FROM food_safe_harbor_assignments
  WHERE assignment_version = 'safe_harbor_v1'
    AND cohort_code = 'cohort_oil_fat';

  SELECT COUNT(*) INTO protein_count
  FROM food_safe_harbor_assignments
  WHERE assignment_version = 'safe_harbor_v1'
    AND cohort_code = 'cohort_plain_protein';

  SELECT COUNT(*) INTO egg_count
  FROM food_safe_harbor_assignments
  WHERE assignment_version = 'safe_harbor_v1'
    AND cohort_code = 'cohort_egg';

  IF oil_count = 0 OR protein_count = 0 OR egg_count = 0 THEN
    RAISE EXCEPTION 'safe_harbor_v1 requires non-empty oil/protein/egg cohorts, got oil=% protein=% egg=%', oil_count, protein_count, egg_count;
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
        '%panure%'
      ]
    );

  IF bad_count <> 0 THEN
    RAISE EXCEPTION 'safe_harbor_v1 protein processing screen failed (% rows)', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM food_safe_harbor_assignments a
  JOIN foods f ON f.food_id = a.food_id
  WHERE a.assignment_version = 'safe_harbor_v1'
    AND a.cohort_code = 'cohort_oil_fat'
    AND COALESCE(lower(f.canonical_name_fr), '') LIKE ANY (
      ARRAY[
        '%margarine%',
        '%allégé%',
        '%allege%',
        '%léger%',
        '%leger%',
        '%à tartiner%',
        '%a tartiner%'
      ]
    );

  IF bad_count <> 0 THEN
    RAISE EXCEPTION 'safe_harbor_v1 oil processing screen failed (% rows)', bad_count;
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
        '%garniture%'
      ]
    );

  IF bad_count <> 0 THEN
    RAISE EXCEPTION 'safe_harbor_v1 egg processing screen failed (% rows)', bad_count;
  END IF;
END $$;

COMMIT;
