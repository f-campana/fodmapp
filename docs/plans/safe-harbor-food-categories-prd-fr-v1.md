# Safe-Harbor Food Categories PRD (FR v1)

Last updated: 2026-03-13  
Owner: Product + Data + API + Mobile  
Status: Implemented

Hard inputs:

- Rights gate: `docs/research/safe-harbor-v1-rights-gate.md` (2026-03-13)
- Rights ledger: `docs/research/safe-harbor-v1-rights-ledger.csv` (2026-03-13)
- Evidence pack (maintainers/reviewers): `docs/research/safe-harbor-evidence-pack-v1.md`
- Implemented API contract: `GET /v0/safe-harbors` (`api/openapi/v0.yaml`)
- Implemented Phase 3 artifacts:
  - `schema/migrations/2026-03-13_safe_harbor_v1.sql`
  - `etl/phase3/sql/phase3_safe_harbor_v1_apply.sql`
  - `etl/phase3/sql/phase3_safe_harbor_v1_checks.sql`

## 1. Objective

Add a proactive “safe foundations” discovery surface that complements the reactive swap engine.

The swap engine answers: “what do I eat instead of X?”

Safe harbors answer: “what can I build meals around without already knowing FODMAP rules?”

V1 is deliberately strict: **composition-compatible safe harbors** for **plain, unprocessed forms**
(very low fermentable carbohydrate). This is a limited compatibility signal, not a medical
guarantee and not a blanket “category is safe” heuristic.

## 2. Problem statement

Today the product is reactive:

1. Users must already suspect a food is problematic to search it.
2. Users without FODMAP literacy do not know which “plain foundation” items can be reasonable
   anchors (oils, plain animal proteins, eggs).

This creates an onboarding UX gap: anxiety and over-restriction framing before users discover
their compatible foundations.

## 3. Locked V1 scope

### In scope (only)

1. Safe-Harbor V1 cohort discovery via `GET /v0/safe-harbors`.
2. Approved cohorts only:
   - `cohort_oil_fat`
   - `cohort_plain_protein`
   - `cohort_egg`
3. Explicit `6/6` internal zero-measurement packs are required for any returned assignment.

### Explicitly out of scope (V1)

- cheese
- rice
- grains/starches
- herbs
- condiments
- tofu
- nuts/seeds
- any merely “low FODMAP” category (non composition-zero)

## 4. Rights-first and public-copy policy (V1)

This PRD follows the rights-first gate. V1 policy requirements:

1. Runtime safe-harbor tagging and API outputs are derived from **CIQUAL and internally generated
   rules only**.
2. Monash public resources are **internal evidence references** and are **not** a runtime or
   public-copy source in V1.
3. NICE text is non-reusable for public copy in V1 unless an explicit license/permission is on
   file.
4. Public docs/API wording must be project-authored and cautious; do not quote or closely restate
   protected Monash/NICE text.
5. CIQUAL/Etalab obligations apply to any public CIQUAL-derived output:
   - attribution,
   - update/version date when available,
   - no endorsement implication,
   - no misleading transformation claims.

## 5. Implementation reality (what V1 actually ships)

Safe-Harbor V1 is now implemented as a **true composition-zero contract** backed by explicit
internal `6/6` zero packs.

Key properties to reflect in product and docs:

1. Runtime/public basis is CIQUAL + internal rules only (`ciqual_2025` + `internal_rules_v1`).
2. Assignments require an explicit internal `6/6` zero-measurement pack.
3. Category membership is only a narrowing gate to find candidates; it is not the basis for
   tagging.
4. Ambiguous/aggregate oils are excluded (generic/blended/unclear identity).
5. Empty approved cohorts are allowed and omitted from the API response.
6. Current seeded result is narrower than the original concept:
   - eggs currently do not qualify under the explicit pack gate and are not returned today.

## 6. Safe-harbor cohort definitions (V1)

All cohort copy must:

1. use project-authored cautious wording
2. avoid absolute language (“always OK”, “100% safe”, “sans restriction”)
3. include mandatory processing caveats (plain/unprocessed only)

### 6.1 `cohort_oil_fat` (oils/fats, plain forms)

Compatibility framing (V1 wording):

- Compatible by composition for plain, unprocessed forms (very low fermentable carbohydrate).

Must exclude:

- blends/mixes and generic “oil for frying” style entries
- flavored oils with unclear additives
- ambiguous/aggregate identities (“sans précision”, “aliment moyen”, etc.)

Safety caveat:

- If surfacing infused-oil guidance, include storage warning: refrigerate homemade infused oils
  and discard after 4 days.

### 6.2 `cohort_plain_protein` (animal proteins, plain forms)

Compatibility framing (V1 wording):

- Compatible by composition for plain, unprocessed forms (very low fermentable carbohydrate).

Must exclude:

- breaded, marinated, sauced, cured, smoked, or heavily seasoned preparations

Processing caveat (mandatory):

- Preparation and added ingredients can change compatibility.

### 6.3 `cohort_egg` (eggs, plain forms)

Compatibility framing (V1 wording):

- Compatible by composition for plain, unprocessed forms (very low fermentable carbohydrate).

Must exclude:

- composite preparations (filled/with sauce/onion/garlic, etc.)

Important note:

- The cohort is approved in scope, but may be omitted from `/v0/safe-harbors` when no CIQUAL-linked
  egg items satisfy the explicit `6/6` zero-pack gate.

## 7. Data model (implemented)

Safe-Harbor V1 is modeled via two tables:

1. `safe_harbor_cohorts`: cohort metadata (labels + rationale + caveats + ordering)
2. `food_safe_harbor_assignments`: per-food assignment (one row per food, per assignment version)

Key contract fields (V1):

- `assignment_version = 'safe_harbor_v1'`
- `assignment_method = 'explicit_measurement_pack_v1'`
- `rule_source_id` must reference `sources.source_slug='internal_rules_v1'`
- `data_source_id` must reference `sources.source_slug='ciqual_2025'`

## 8. Data pipeline (implemented)

Safe-Harbor V1 assignments and explicit packs are materialized by:

- `etl/phase3/sql/phase3_safe_harbor_v1_apply.sql`
- `etl/phase3/sql/phase3_safe_harbor_v1_checks.sql`

Contract constraints:

1. Only CIQUAL-linked foods are eligible for runtime/public Safe-Harbor V1 output.
2. Category membership is used only to narrow candidate sets; tagging requires explicit internal
   `6/6` zero packs + exclusion screens.
3. Ambiguous/aggregate oils are excluded by name/identity screening.
4. Empty cohorts are allowed (no “force include empty cohort” requirement in the API).

## 9. API contract (implemented)

### 9.1 `GET /v0/safe-harbors`

Returns Safe-Harbor V1 foods grouped by cohort, derived only from explicit internal `6/6`
zero-measurement packs tied to CIQUAL-linked foods and internal rules.

Response properties (high-signal):

1. `cohorts[]` contains only non-empty cohorts, deterministically ordered.
2. `meta.attribution` must include CIQUAL source attribution and update/version date when
   available.
3. `meta.no_endorsement_notice` must state that ANSES endorsement is not claimed.

## 10. Risks and mitigations (docs-facing)

1. False-safe interpretation due to processing.
   - Mitigation: mandatory “plain/unprocessed only” caveat everywhere this surface appears.
2. Rights/copy risk (Monash/NICE reuse).
   - Mitigation: CIQUAL + internal rules only for runtime/public; project-authored copy only.
3. “Empty cohort surprise” (eggs not returned).
   - Mitigation: document that empty approved cohorts are omitted and that seed eligibility is
     conservative by design.

## 11. Acceptance criteria (V1, implemented)

1. `/v0/safe-harbors` returns only cohorts within the approved V1 set.
2. Empty approved cohorts may be omitted from the response.
3. Every returned item is backed by an explicit internal `6/6` zero-measurement pack and has
   `assignment_method='explicit_measurement_pack_v1'`.
4. Ambiguous/aggregate oil entries are excluded by screening rules.
5. API metadata includes CIQUAL attribution + no-endorsement notice and records rule/data source
   slugs.
