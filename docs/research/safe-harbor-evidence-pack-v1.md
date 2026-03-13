# Safe-Harbor V1 — Evidence Pack (Docs Alignment)

Last updated: 2026-03-13  
Status: Implemented  
Scope lock: `cohort_oil_fat`, `cohort_plain_protein`, `cohort_egg` only

Hard inputs:

- Rights gate: `docs/research/safe-harbor-v1-rights-gate.md` (2026-03-13)
- Rights ledger: `docs/research/safe-harbor-v1-rights-ledger.csv` (2026-03-13)
- Implemented contract: `GET /v0/safe-harbors` (`api/openapi/v0.yaml`) + Phase 3 apply/checks
  (`etl/phase3/sql/phase3_safe_harbor_v1_apply.sql`, `etl/phase3/sql/phase3_safe_harbor_v1_checks.sql`)

## 1. Executive summary

Safe-Harbor V1 is a **composition-compatible discovery surface** that complements the reactive
swap engine. It is intentionally strict:

1. Runtime/public outputs are **CIQUAL + internal rules only** (no Monash or NICE runtime/public
   derivation in V1).
2. A food is returned only if it has an **explicit internal `6/6` zero-measurement pack** (six
   subtype measurement rows at `0`) and passes exclusion screens.
3. **Category membership is only a narrowing gate** to find candidates; it is not sufficient for
   tagging.
4. Ambiguous/aggregate oils are excluded (generic, blended, or unclear identity entries).
5. Empty approved cohorts are allowed and **omitted from the API response**.

Current seeded reality:

- `cohort_egg` is approved but currently has **no qualifying items** under the explicit pack gate,
  so it is not returned by `/v0/safe-harbors` today.

## 2. Implemented contract (what is shipped)

This section describes **implemented behavior**, not category heuristics or generalized nutrition
guidance.

### 2.1 Endpoint behavior

`GET /v0/safe-harbors` returns:

- `cohorts[]`: only **non-empty** cohorts, ordered deterministically.
- `meta`: includes cohort rule provenance and CIQUAL attribution + a no-endorsement notice.

Each returned cohort includes:

- bilingual labels and project-authored rationale/caveat fields
- `items[]`: foods (CIQUAL-linked) assigned to that cohort
- `total`: count of returned items

### 2.2 Tagging basis and provenance (runtime/public)

Safe-Harbor V1 cohort assignment is derived from:

- CIQUAL nutrient observations (candidate gates), and
- internally generated rules and explicit measurement packs (`internal_rules_v1`).

Monash and NICE resources are treated as **internal evidence references only** in V1 and must not
be used as runtime/public text or derivation sources.

## 3. Evidence and rights summary

This section distinguishes:

1. direct source support (rights, attribution, safety)
2. internal inference boundaries (what we allow ourselves to claim)
3. implemented contract constraints (what we actually ship)

### 3.1 Direct source support (rights + attribution)

From the rights gate and ledger (accessed 2026-03-13):

- CIQUAL 2025 reuse is allowed under Etalab Open Licence 2.0, with **mandatory attribution** and
  **no implied endorsement**.
- Monash content/data is not approved for runtime/public derivation in V1 under the maintainer
  policy.
- NICE text is non-reusable for public copy in V1 unless separately licensed.
- Peer-reviewed and guideline sources can be cited, but do not reproduce full text/tables/figures
  unless licensing allows it.

### 3.2 Direct source support (infused oil storage safety)

If infused oils are surfaced in the safe-harbor UI, we include a food-safety warning:

- refrigerate homemade garlic/herb oils, and
- discard unused oil after 4 days.

This warning is required by the rights gate safety guardrails and is supported in the rights
ledger via government/extension guidance sources (see `docs/research/safe-harbor-v1-rights-ledger.csv`).

### 3.3 Internal inference boundary (scientific/copy discipline)

We treat Safe-Harbor V1 as **compatibility by composition for plain, unprocessed forms** and avoid
absolute language.

Allowed framing (project-authored):

- "Compatible by composition for plain, unprocessed forms (very low fermentable carbohydrate)."

Disallowed framing:

- "always OK"
- "100% safe"
- "sans restriction"
- "guaranteed zero FODMAP"

Also required:

- processing caveats are mandatory (marinade/sauce/seasoning/breading can change compatibility)
- compatibility does not imply symptom-free outcomes for all users

## 4. Approved V1 scope (and explicit exclusions)

### 4.1 Approved cohorts (only)

- `cohort_oil_fat`
- `cohort_plain_protein`
- `cohort_egg`

### 4.2 Explicitly out of scope (V1)

- cheese
- rice
- grains/starches
- herbs
- condiments
- tofu
- nuts/seeds
- any merely “low FODMAP” category (non composition-zero)

These are deferred because they require different serving-size semantics, product-variant rules,
and separate evidence + rights review.

## 5. Maintainer checklist (docs-facing)

Before shipping/announcing Safe-Harbor V1 surfaces:

1. Confirm public/runtime basis is CIQUAL + internal rules only (no Monash/NICE-derived runtime
   tags or public-copy fields).
2. Confirm CIQUAL attribution and no-endorsement notices are present in API metadata and release
   notes.
3. Confirm cohort caveats always mention plain/unprocessed preparation and include the infused
   oil storage warning where relevant.
4. Confirm docs avoid absolute or prescriptive medical language.
