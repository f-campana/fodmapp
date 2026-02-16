# CIQUAL 2025 Validation Report (Hybrid ETL v1)

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

| CIQUAL code | Nutrient | Column |
|---|---|---|
| 32210 | Fructose | 20 |
| 32250 | Glucose | 22 |
| 32410 | Lactose | 23 |
| 34000 | Polyols total | 28 |
| 32000 | Sugars total | 19 |

## 3. Coverage snapshot

| Nutrient | Foods with data | Coverage |
|---|---:|---:|
| Fructose | 1,836 | 52.7% |
| Glucose | 1,878 | 53.9% |
| Lactose | 1,680 | 48.2% |
| Polyols (total) | 3,036 (numeric+trace) | 87.1% |
| Sugars | 3,261 (numeric+trace) | 93.6% |

`< value` and `trace` markers are common, so comparator preservation is required for correct semantics.

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

CIQUAL does not provide direct coverage for:

- Fructans
- GOS
- Sorbitol vs. mannitol separation

This remains the main blocker for garlic/onion/wheat/legume precision and requires Phase 2 research data.

## 6. Hardening delivered in ETL v1

Implemented in `/Users/fabiencampana/Documents/Fodmap/etl/ciqual/ciqual_etl.py`:

- Streaming workbook reads (`iter_rows(values_only=True)`) for inspect/stats/load
- Hybrid enrichment model:
  - nutrients from XLSX
  - FR identity/hierarchy from XML
- FR-first canonical policy:
  - no placeholder `CIQUAL <code>` fallback
  - row skip + error log when FR name cannot be resolved
- Raw CIQUAL taxonomy persistence in SQL:
  - deterministic category codes
  - category hierarchy upsert to `food_categories` (`source_system='ciqual_2025'`)
  - deepest-node food membership in `food_category_memberships`
  - aggregate `alim_grp_code='00'` excluded from membership

## 7. Operational checks

Run after load:

```sql
SELECT count(*)
FROM foods
WHERE canonical_name_fr ~ '^CIQUAL [0-9]+$';
```

```sql
SELECT count(*)
FROM food_categories
WHERE source_system = 'ciqual_2025';
```

```sql
SELECT derivation_status, count(*)
FROM v_food_excess_fructose_latest
GROUP BY derivation_status
ORDER BY count(*) DESC;
```

## 8. Next track

- Add curated non-CIQUAL evidence for fructans, GOS, and sorbitol/mannitol split
- Keep CIQUAL as structured baseline and provenance anchor for FR market foods
