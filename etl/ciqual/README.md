# CIQUAL ETL (FR-First Hybrid)

This loader ingests CIQUAL 2025 into the FODMAP SQL schema using a hybrid model:

- `Table Ciqual 2025_ENG_2025_11_03.xlsx` for nutrient observations
- `alim_2025_11_03.xml` for canonical food identity (including French names)
- `alim_grp_2025_11_03.xml` for raw CIQUAL category hierarchy

## Scope

What this ETL writes:

- `foods`, `food_external_refs`, `food_names`
- `food_nutrient_observations` (fructose, glucose, lactose, total polyols, sugars)
- `food_categories` (`source_system='ciqual_2025'`) + `food_category_memberships`

What it does not solve:

- Fructans
- GOS
- Sorbitol vs. mannitol split

Those require Phase 2 research sources.

## FR-first behavior

`canonical_name_fr` is resolved from `alim_*.xml` first.

If a food has no French name after XML enrichment, that row is skipped and reported as an error.
No `CIQUAL <code>` placeholder names are created.

## Requirements

```bash
pip install openpyxl psycopg2-binary
```

Schema must already be applied:

- `/Users/fabiencampana/Documents/Fodmap/schema/fodmap_fr_schema.sql`

## Commands

### Inspect workbook mapping

```bash
python /Users/fabiencampana/Documents/Fodmap/etl/ciqual/ciqual_etl.py inspect \
  "/Users/fabiencampana/Downloads/ciqual-data/Table Ciqual 2025_ENG_2025_11_03.xlsx"
```

### Coverage stats

```bash
time python /Users/fabiencampana/Documents/Fodmap/etl/ciqual/ciqual_etl.py stats \
  "/Users/fabiencampana/Downloads/ciqual-data/Table Ciqual 2025_ENG_2025_11_03.xlsx"
```

### Load into Postgres

```bash
python /Users/fabiencampana/Documents/Fodmap/etl/ciqual/ciqual_etl.py load \
  "/Users/fabiencampana/Downloads/ciqual-data/Table Ciqual 2025_ENG_2025_11_03.xlsx" \
  --alim-xml "/Users/fabiencampana/Downloads/ciqual-data/alim_2025_11_03.xml" \
  --alim-grp-xml "/Users/fabiencampana/Downloads/ciqual-data/alim_grp_2025_11_03.xml" \
  --db-url "postgresql://postgres@localhost:5432/fodmap_test"
```

## Post-load checks

### Placeholder FR names should be absent

```sql
SELECT count(*)
FROM foods
WHERE canonical_name_fr ~ '^CIQUAL [0-9]+$';
```

### CIQUAL category nodes and memberships should exist

```sql
SELECT count(*) AS ciqual_categories
FROM food_categories
WHERE source_system = 'ciqual_2025';

SELECT count(*) AS ciqual_memberships
FROM food_category_memberships fcm
JOIN food_categories fc ON fc.category_id = fcm.category_id
WHERE fc.source_system = 'ciqual_2025';
```

### Excess fructose derivation should be populated

```sql
SELECT derivation_status, count(*)
FROM v_food_excess_fructose_latest
GROUP BY derivation_status
ORDER BY count(*) DESC;
```
