\set ON_ERROR_STOP on

BEGIN;

-- Phase 3 SQL MVP: apply curated culinary traits for priority ranks 1..42.

CREATE TEMP TABLE phase3_expected_ranks (priority_rank INTEGER PRIMARY KEY) ON COMMIT DROP;
INSERT INTO phase3_expected_ranks(priority_rank)
SELECT generate_series(1, 42);

CREATE TEMP TABLE stg_roles (
  priority_rank INTEGER,
  role_code TEXT,
  intensity SMALLINT,
  source_slug TEXT,
  notes TEXT
) ON COMMIT DROP;

CREATE TEMP TABLE stg_flavors (
  priority_rank INTEGER,
  flavor_code TEXT,
  intensity SMALLINT,
  source_slug TEXT,
  notes TEXT
) ON COMMIT DROP;

CREATE TEMP TABLE stg_textures (
  priority_rank INTEGER,
  texture_code TEXT,
  intensity SMALLINT,
  source_slug TEXT,
  notes TEXT
) ON COMMIT DROP;

CREATE TEMP TABLE stg_behaviors (
  priority_rank INTEGER,
  behavior_code TEXT,
  source_slug TEXT,
  notes TEXT
) ON COMMIT DROP;

CREATE TEMP TABLE stg_cuisines (
  priority_rank INTEGER,
  cuisine_code TEXT,
  weight NUMERIC(4,3),
  source_slug TEXT,
  notes TEXT
) ON COMMIT DROP;

CREATE TEMP TABLE stg_exemptions (
  priority_rank INTEGER,
  trait_domain TEXT,
  reason TEXT
) ON COMMIT DROP;

\copy stg_roles (priority_rank,role_code,intensity,source_slug,notes) FROM 'etl/phase3/data/phase3_food_culinary_roles_v1.csv' WITH (FORMAT csv, HEADER true)
\copy stg_flavors (priority_rank,flavor_code,intensity,source_slug,notes) FROM 'etl/phase3/data/phase3_food_flavor_profiles_v1.csv' WITH (FORMAT csv, HEADER true)
\copy stg_textures (priority_rank,texture_code,intensity,source_slug,notes) FROM 'etl/phase3/data/phase3_food_texture_profiles_v1.csv' WITH (FORMAT csv, HEADER true)
\copy stg_behaviors (priority_rank,behavior_code,source_slug,notes) FROM 'etl/phase3/data/phase3_food_cooking_behaviors_v1.csv' WITH (FORMAT csv, HEADER true)
\copy stg_cuisines (priority_rank,cuisine_code,weight,source_slug,notes) FROM 'etl/phase3/data/phase3_food_cuisine_affinities_v1.csv' WITH (FORMAT csv, HEADER true)
\copy stg_exemptions (priority_rank,trait_domain,reason) FROM 'etl/phase3/data/phase3_trait_exemptions_v1.csv' WITH (FORMAT csv, HEADER true)

DO $$
DECLARE
  bad_count INTEGER;
BEGIN
  -- Locked MVP policy: exemptions table is present but must be empty.
  SELECT COUNT(*) INTO bad_count FROM stg_exemptions;
  IF bad_count <> 0 THEN
    RAISE EXCEPTION 'phase3 exemptions must be empty for MVP, got % rows', bad_count;
  END IF;

  -- Ensure only expected ranks 1..42 are used and each rank is represented in every domain file.
  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT DISTINCT priority_rank FROM stg_roles
    EXCEPT
    SELECT priority_rank FROM phase3_expected_ranks
  ) AS x;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_roles contains priority ranks outside 1..42';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT DISTINCT priority_rank FROM stg_flavors
    EXCEPT
    SELECT priority_rank FROM phase3_expected_ranks
  ) AS x;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_flavors contains priority ranks outside 1..42';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT DISTINCT priority_rank FROM stg_textures
    EXCEPT
    SELECT priority_rank FROM phase3_expected_ranks
  ) AS x;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_textures contains priority ranks outside 1..42';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT DISTINCT priority_rank FROM stg_behaviors
    EXCEPT
    SELECT priority_rank FROM phase3_expected_ranks
  ) AS x;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_behaviors contains priority ranks outside 1..42';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT DISTINCT priority_rank FROM stg_cuisines
    EXCEPT
    SELECT priority_rank FROM phase3_expected_ranks
  ) AS x;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_cuisines contains priority ranks outside 1..42';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT priority_rank FROM phase3_expected_ranks
    EXCEPT
    SELECT DISTINCT priority_rank FROM stg_roles
  ) AS missing;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_roles missing ranks in 1..42 set';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT priority_rank FROM phase3_expected_ranks
    EXCEPT
    SELECT DISTINCT priority_rank FROM stg_flavors
  ) AS missing;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_flavors missing ranks in 1..42 set';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT priority_rank FROM phase3_expected_ranks
    EXCEPT
    SELECT DISTINCT priority_rank FROM stg_textures
  ) AS missing;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_textures missing ranks in 1..42 set';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT priority_rank FROM phase3_expected_ranks
    EXCEPT
    SELECT DISTINCT priority_rank FROM stg_behaviors
  ) AS missing;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_behaviors missing ranks in 1..42 set';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM (
    SELECT priority_rank FROM phase3_expected_ranks
    EXCEPT
    SELECT DISTINCT priority_rank FROM stg_cuisines
  ) AS missing;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_cuisines missing ranks in 1..42 set';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_roles WHERE source_slug <> 'internal_rules_v1' OR intensity NOT BETWEEN 1 AND 5;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_roles invalid source_slug/intensity';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_flavors WHERE source_slug <> 'internal_rules_v1' OR intensity NOT BETWEEN 1 AND 5;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_flavors invalid source_slug/intensity';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_textures WHERE source_slug <> 'internal_rules_v1' OR intensity NOT BETWEEN 1 AND 5;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_textures invalid source_slug/intensity';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_behaviors WHERE source_slug <> 'internal_rules_v1';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_behaviors invalid source_slug';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_cuisines
  WHERE source_slug <> 'internal_rules_v1' OR weight < 0 OR weight > 1;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_cuisines invalid source_slug/weight';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_roles r
  LEFT JOIN culinary_roles c ON c.role_code = r.role_code
  WHERE c.role_code IS NULL;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_roles contains unknown role_code';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_flavors f
  LEFT JOIN flavor_notes n ON n.flavor_code = f.flavor_code
  WHERE n.flavor_code IS NULL;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_flavors contains unknown flavor_code';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_textures t
  LEFT JOIN texture_traits tt ON tt.texture_code = t.texture_code
  WHERE tt.texture_code IS NULL;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_textures contains unknown texture_code';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_behaviors b
  LEFT JOIN cooking_behaviors cb ON cb.behavior_code = b.behavior_code
  WHERE cb.behavior_code IS NULL;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_behaviors contains unknown behavior_code';
  END IF;

  SELECT COUNT(*) INTO bad_count
  FROM stg_cuisines c
  LEFT JOIN cuisine_tags t ON t.cuisine_code = c.cuisine_code
  WHERE t.cuisine_code IS NULL;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'stg_cuisines contains unknown cuisine_code';
  END IF;
END $$;

CREATE TEMP TABLE phase3_target_foods ON COMMIT DROP AS
SELECT p.priority_rank, p.resolved_food_id AS food_id
FROM phase2_priority_foods p
JOIN phase3_expected_ranks e ON e.priority_rank = p.priority_rank
WHERE p.resolved_food_id IS NOT NULL;

DO $$
DECLARE
  c INTEGER;
BEGIN
  SELECT COUNT(*) INTO c FROM phase3_target_foods;
  IF c <> 42 THEN
    RAISE EXCEPTION 'expected 42 resolved phase3 target foods, got %', c;
  END IF;
END $$;

CREATE TEMP TABLE phase3_source ON COMMIT DROP AS
SELECT source_id
FROM sources
WHERE source_slug = 'internal_rules_v1';

DO $$
DECLARE c INTEGER;
BEGIN
  SELECT COUNT(*) INTO c FROM phase3_source;
  IF c <> 1 THEN
    RAISE EXCEPTION 'source internal_rules_v1 must resolve to exactly one row, got %', c;
  END IF;
END $$;

DELETE FROM food_culinary_roles
WHERE food_id IN (SELECT food_id FROM phase3_target_foods);

DELETE FROM food_flavor_profiles
WHERE food_id IN (SELECT food_id FROM phase3_target_foods);

DELETE FROM food_texture_profiles
WHERE food_id IN (SELECT food_id FROM phase3_target_foods);

DELETE FROM food_cooking_behaviors
WHERE food_id IN (SELECT food_id FROM phase3_target_foods);

DELETE FROM food_cuisine_affinities
WHERE food_id IN (SELECT food_id FROM phase3_target_foods);

INSERT INTO food_culinary_roles (food_id, role_code, intensity, source_id)
SELECT tf.food_id, s.role_code, s.intensity, src.source_id
FROM stg_roles s
JOIN phase3_target_foods tf ON tf.priority_rank = s.priority_rank
CROSS JOIN phase3_source src;

INSERT INTO food_flavor_profiles (food_id, flavor_code, intensity, source_id)
SELECT tf.food_id, s.flavor_code, s.intensity, src.source_id
FROM stg_flavors s
JOIN phase3_target_foods tf ON tf.priority_rank = s.priority_rank
CROSS JOIN phase3_source src;

INSERT INTO food_texture_profiles (food_id, texture_code, intensity, source_id)
SELECT tf.food_id, s.texture_code, s.intensity, src.source_id
FROM stg_textures s
JOIN phase3_target_foods tf ON tf.priority_rank = s.priority_rank
CROSS JOIN phase3_source src;

INSERT INTO food_cooking_behaviors (food_id, behavior_code, source_id)
SELECT tf.food_id, s.behavior_code, src.source_id
FROM stg_behaviors s
JOIN phase3_target_foods tf ON tf.priority_rank = s.priority_rank
CROSS JOIN phase3_source src;

INSERT INTO food_cuisine_affinities (food_id, cuisine_code, weight, source_id)
SELECT tf.food_id, s.cuisine_code, s.weight, src.source_id
FROM stg_cuisines s
JOIN phase3_target_foods tf ON tf.priority_rank = s.priority_rank
CROSS JOIN phase3_source src;

SELECT 'food_culinary_roles' AS table_name, COUNT(*) AS row_count
FROM food_culinary_roles
WHERE food_id IN (SELECT food_id FROM phase3_target_foods)
UNION ALL
SELECT 'food_flavor_profiles', COUNT(*)
FROM food_flavor_profiles
WHERE food_id IN (SELECT food_id FROM phase3_target_foods)
UNION ALL
SELECT 'food_texture_profiles', COUNT(*)
FROM food_texture_profiles
WHERE food_id IN (SELECT food_id FROM phase3_target_foods)
UNION ALL
SELECT 'food_cooking_behaviors', COUNT(*)
FROM food_cooking_behaviors
WHERE food_id IN (SELECT food_id FROM phase3_target_foods)
UNION ALL
SELECT 'food_cuisine_affinities', COUNT(*)
FROM food_cuisine_affinities
WHERE food_id IN (SELECT food_id FROM phase3_target_foods);

COMMIT;
