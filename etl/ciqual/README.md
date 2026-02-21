# CIQUAL ETL (FR-First Hybrid)

This loader ingests CIQUAL 2025 into the FODMAP SQL schema using a hybrid model:

- `Table Ciqual 2025_ENG_2025_11_03.xlsx` for nutrient observations
- `alim_2025_11_03.xml` for canonical food identity (including French names)
- `alim_grp_2025_11_03.xml` for raw CIQUAL category hierarchy

## Scope

What this ETL writes:

- `foods`, `food_external_refs`, `food_names`
- `food_nutrient_observations` for six CIQUAL nutrients:
  - `CIQUAL_32210` fructose
  - `CIQUAL_32220` galactose
  - `CIQUAL_32250` glucose
  - `CIQUAL_32410` lactose
  - `CIQUAL_34000` total polyols
  - `CIQUAL_32000` sugars
- `food_categories` (`source_system='ciqual_2025'`) + `food_category_memberships`

What it does not solve:

- Fructans
- GOS direct concentration values
- Sorbitol vs. mannitol split

Those require Phase 2 evidence sources.

## FR-name policy and quality gate

`canonical_name_fr` is nullable in schema v1.1 and can be null for unresolved rows.

Load behavior:

- FR name is resolved XML-first.
- If unresolved, row is still loaded (`canonical_name_fr = NULL`) to preserve nutrient coverage.
- After load, ETL verifies CIQUAL-linked foods with `canonical_name_fr IS NULL`.
- If unresolved remain, the command exits non-zero.

This enforces quality while keeping ingestion complete.

## Requirements

```bash
pip install openpyxl psycopg2-binary
```

Schema must already be applied:

- `schema/fodmap_fr_schema.sql`

## Commands

### Inspect workbook mapping

```bash
python etl/ciqual/ciqual_etl.py inspect \
  "etl/ciqual/data/raw/Table Ciqual 2025_ENG_2025_11_03.xlsx"
```

### Coverage stats

```bash
time python etl/ciqual/ciqual_etl.py stats \
  "etl/ciqual/data/raw/Table Ciqual 2025_ENG_2025_11_03.xlsx"
```

### Load into Postgres

```bash
python etl/ciqual/ciqual_etl.py load \
  "etl/ciqual/data/raw/Table Ciqual 2025_ENG_2025_11_03.xlsx" \
  --alim-xml "etl/ciqual/data/raw/alim_2025_11_03.xml" \
  --alim-grp-xml "etl/ciqual/data/raw/alim_grp_2025_11_03.xml" \
  --db-url "postgresql://$USER@localhost:5432/fodmap_test"
```

If `--db-url` is omitted, the ETL defaults to:

`postgresql://<USER>@localhost:5432/fodmap_test`

where `<USER>` comes from `os.getenv("USER", "postgres")`. This matches common macOS/Homebrew setups where the local role is your system username, not always `postgres`.

`--db-url` remains the authoritative override for CI/CD and non-local environments.

## Post-load checks

### Unresolved FR names gate

```sql
SELECT count(DISTINCT f.food_id)
FROM foods f
JOIN food_external_refs fer ON fer.food_id = f.food_id
WHERE fer.ref_system = 'CIQUAL'
  AND f.canonical_name_fr IS NULL;
```

### CIQUAL category nodes and memberships

```sql
SELECT count(*) AS ciqual_categories
FROM food_categories
WHERE source_system = 'ciqual_2025';

SELECT count(*) AS ciqual_memberships
FROM food_category_memberships fcm
JOIN food_categories fc ON fc.category_id = fcm.category_id
WHERE fc.source_system = 'ciqual_2025';
```

### Excess fructose derivation

```sql
SELECT derivation_status, count(*)
FROM v_food_excess_fructose_latest
GROUP BY derivation_status
ORDER BY count(*) DESC;
```
