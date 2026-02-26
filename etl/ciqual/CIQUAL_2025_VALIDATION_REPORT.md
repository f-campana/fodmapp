# CIQUAL 2025 Validation Report (Hybrid ETL v1.1)

**Date:** 2026-02-16  
**Primary file:** `Table Ciqual 2025_ENG_2025_11_03.xlsx`  
**Auxiliary files:** `alim_2025_11_03.xml`, `alim_grp_2025_11_03.xml`  
**Source:** ANSES CIQUAL 2025

## 1. Dataset shape

- Workbook sheet: `food composition`
- Rows: 3,484 foods
- Columns: 84
- Value formats include French decimals (`0,3`), comparators (`< 0,2`), `traces`, and `-` for missing

## 2. Validated nutrient mapping

| CIQUAL code | Nutrient      | Column |
| ----------- | ------------- | ------ |
| 32210       | Fructose      | 20     |
| 32220       | Galactose     | 21     |
| 32250       | Glucose       | 22     |
| 32410       | Lactose       | 23     |
| 34000       | Polyols total | 28     |
| 32000       | Sugars total  | 19     |

## 3. Coverage snapshot

| Nutrient        |              Foods with data | Coverage |
| --------------- | ---------------------------: | -------: |
| Fructose        |                        1,836 |    52.7% |
| Galactose       | 1,179 (numeric+<value+trace) |    21.3% |
| Glucose         |                        1,878 |    53.9% |
| Lactose         |                        1,680 |    48.2% |
| Polyols (total) |        3,036 (numeric+trace) |    87.1% |
| Sugars          |        3,261 (numeric+trace) |    93.6% |

Comparator-preserving ingestion remains required due to high `< value` and `trace` frequency.

## 4. Excess fructose verification

From comparable fructose+glucose rows:

- Both comparable present: 1,821 foods
- Excess fructose > 0: 508 foods
- Excess fructose > 0.15 g/100g: 288 foods
- Excess fructose > 0.40 g/100g: 165 foods

Top foods match expected high-excess profile (chicory, pears, apples, mango, honey).

## 5. CIQUAL subtype coverage limits (scientific)

CIQUAL supports direct MVP signals for:

- Excess fructose (derived from fructose - glucose)
- Lactose
- Total polyols (combined)
- Galactose context signal (limited, not direct GOS content)

CIQUAL does not provide direct coverage for:

- Fructans
- GOS concentration values
- Sorbitol vs. mannitol separation

This remains the key blocker for garlic/onion/wheat/legume precision and requires Phase 2 sources.

## 6. Hardening delivered in ETL v1.1

Implemented in `etl/ciqual/ciqual_etl.py`:

- Streaming reads (`iter_rows(values_only=True)`) in inspect/stats/load
- Hybrid ingestion contract:
  - nutrients from XLSX
  - FR identity/hierarchy from XML
- Added galactose extraction (`CIQUAL_32220`)
- Granular savepoints:
  - food upsert
  - category assignment
  - per-observation insert
- Group `alim_grp_code='00'` rows are loaded for nutrient coverage but excluded from category membership
- Unresolved FR handling:
  - rows can be ingested with `canonical_name_fr = NULL`
  - load exits non-zero if unresolved CIQUAL-linked foods remain

## 7. Operational checks

### Unresolved FR-name gate

```sql
SELECT count(DISTINCT f.food_id)
FROM foods f
JOIN food_external_refs fer ON fer.food_id = f.food_id
WHERE fer.ref_system = 'CIQUAL'
  AND f.canonical_name_fr IS NULL;
```

### CIQUAL taxonomy persistence

```sql
SELECT count(*)
FROM food_categories
WHERE source_system = 'ciqual_2025';
```

### Excess fructose view

```sql
SELECT derivation_status, count(*)
FROM v_food_excess_fructose_latest
GROUP BY derivation_status
ORDER BY count(*) DESC;
```

## 8. Next track

- Add curated non-CIQUAL evidence for fructans, GOS, and sorbitol/mannitol split
- Keep CIQUAL as structured baseline and provenance anchor for FR market foods
