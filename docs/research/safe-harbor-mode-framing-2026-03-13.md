# Safe-Harbor Mode Framing (2026-03-13)

Status: Discussion note for future product framing.
Audience: Maintainer / Product / Frontend collaborator
Related docs: [docs/foundation/project-definition.md](../foundation/project-definition.md), [docs/frontend/strategy.md](../frontend/strategy.md), [docs/plans/safe-harbor-food-categories-prd-fr-v1.md](../plans/safe-harbor-food-categories-prd-fr-v1.md)

## Why This Note Exists

Safe-Harbor V1 established a strict evidence-backed lane:

1. CIQUAL + internal rules only for public/runtime outputs
2. explicit `6/6` zero-measurement packs
3. very narrow cohort scope
4. fewer returned foods rather than speculative claims

That work surfaced a broader product question:

Should FODMAPP eventually provide a lighter guidance layer for users who do not already understand
low-FODMAP concepts, while keeping the strict scientific core intact?

This note records the current thinking, concerns, and recommended framing.

## Core Conclusion

Do not introduce a feature literally called `non-scientific mode`.

If a lighter guidance layer is added later, it should be positioned as:

1. `Strict` or `Evidence-backed` guidance
2. `Guided` or `Discovery` help
3. explicit uncertainty labels between the two

The product should never imply that one mode is "real science" and the other is "made up." The
boundary must instead be about confidence, evidence basis, and intended use.

## Why "Non-Scientific Mode" Is The Wrong Frame

### 1. It weakens trust

Users may read "non-scientific" as:

1. arbitrary
2. unsafe
3. marketing-driven
4. inconsistent with the rest of the project

That is especially risky in a repo positioned as evidence-backed and safety-conscious.

### 2. It collapses two different jobs into one label

There are at least two distinct future product layers:

1. a strict evidence-backed decision layer
2. a practical usability layer that helps users browse, scan, or learn faster

Calling the second one "non-scientific" is imprecise. Many convenience features may still be
scientifically informed; they are just not held to the same contract strength as the strict lane.

### 3. It creates UI and API ambiguity

If the app presents a food as "safe" in one place and "heuristic" in another without explicit
confidence framing, users will not understand the difference. This can easily produce false-safe
interpretation.

## Recommended Product Framing

### 1. Keep a strict core

This is the current Safe-Harbor V1 model:

1. auditable data contract
2. conservative eligibility
3. public/runtime fields backed by allowed sources only
4. explicit exclusion when confidence is not high enough

This lane should remain the canonical source for:

1. high-confidence safe-harbor foods
2. swap logic
3. deterministic API behavior
4. any product surfaces that look authoritative

### 2. Add a guided layer later, not a "non-scientific" layer

Possible future names:

1. `Guided`
2. `Discovery`
3. `Practical`

This layer could support:

1. onboarding education
2. "start here" category suggestions
3. label-reading prompts
4. broader browsing help
5. user reassurance about meal-building patterns

But it must be explicitly labeled as lower-confidence or broader-scope guidance than the strict
lane.

### 3. Make confidence visible

If multiple guidance layers exist later, every surfaced item should clearly indicate which contract
it belongs to.

Example mental model:

1. `Verified`
2. `Compatible by composition`
3. `Likely OK, check label`
4. `Not enough evidence`

These are example labels only. They are not approved copy.

## Main Concerns To Preserve

### 1. False-safe labeling

This is the primary product risk.

The strict lane exists to prevent broad category claims from being mistaken for verified food-level
safety. Any guided/discovery layer must not silently reuse strict affordances such as badges,
colors, or claims without showing a different confidence basis.

### 2. Source-rights drift

The Safe-Harbor V1 rights gate already forced a narrow public/runtime contract.

If a broader guidance layer is added later, it must not accidentally expand public use of source
families that are currently limited to internal evidence only.

### 3. Product-language drift

Phrases such as:

1. `always OK`
2. `100% safe`
3. `sans restriction`

should remain disallowed unless the underlying product contract changes materially.

### 4. Mode confusion

If future users can toggle or move between guidance layers, the app must explain:

1. what each layer means
2. why results differ
3. which layer is more conservative

Without that explanation, "guided" features will be interpreted as evidence-equivalent.

## Suggested Future Structure

If this direction is pursued later, prefer a layered model:

1. `Strict`
   Only high-confidence, auditable, contract-backed outputs.
2. `Guided`
   Practical help with explicit uncertainty and softer claims.
3. `Tracking`
   Symptom logging, onboarding, and personalization surfaces that are not themselves food-proof
   engines.

This keeps product jobs separated:

1. evidence-backed food decisions
2. everyday usability and learning
3. personal workflow support

## Why Tracking Fits Well

Symptoms tracking is a strong candidate for a future product lane because it solves a different
problem from food-proof logic.

Food guidance answers:

1. what the product can justify about foods
2. what the user may want to try or avoid

Tracking answers:

1. what the user actually experienced
2. what patterns may be worth reviewing later
3. what information may support future personalization

This is useful even when food-level evidence remains narrow or incomplete.

## Recommended Tracking Positioning

If tracking is added, it should be framed as:

1. self-observation support
2. pattern review support
3. non-diagnostic journaling

It should not be framed as:

1. diagnosis
2. treatment
3. medical certainty
4. automated causal proof

That keeps it aligned with the current project definition and supportive-only language guardrails.

## Suggested Tracking V1 Scope

A small Symptoms Tracking V1 would likely be strongest if it focuses on structured logging rather
than premature "insight" claims.

Good V1 candidates:

1. symptom event logging
2. meal or food exposure logging
3. stool-pattern logging
4. free-text notes
5. simple timeline/history view

Potentially useful but likely not V1:

1. automated trigger attribution
2. predictive risk scoring
3. clinician-facing reporting workflows
4. strong causal language such as "this food caused your symptoms"

## Why Tracking Should Stay Separate From Strict Food Logic

Tracking is valuable, but it should not be used to silently weaken the evidence-backed food layer.

Important separations:

1. a logged user reaction is not the same as a validated food classification
2. a correlation in the journal is not proof of causation
3. personalization should be additive to the strict evidence-backed core, not a replacement for it

This separation is important both for user trust and for future compliance or product-language
discipline.

## Suggested Future Tracking Questions

Before a tracking lane is implemented, these questions should be answered in a dedicated framing
doc or PRD:

1. What exact symptom model is logged: simple severity, structured symptom types, or both?
2. What is the minimum useful journal unit: symptom event, meal, day summary, or combined log?
3. What consent and privacy boundaries apply to stored symptom history?
4. Should V1 tracking be journal-first or insight-first?
5. What export or delete expectations should exist from day one?
6. How should the app explain that tracking can suggest patterns without proving causes?

## What Other App Patterns Suggest

At a high level, adjacent apps appear to cluster into three broad patterns:

1. evidence-first reference apps
2. convenience-first scanner or discovery apps
3. tracking or coaching apps

FODMAPP is currently strongest in the first category. If it expands, it should do so intentionally
without weakening the current evidence-backed positioning.

This note records the product pattern only. It is not a competitive audit or source-of-truth
market analysis.

## Current Recommendation

Near-term recommendation:

1. keep Safe-Harbor V1 strict
2. do not add a "non-scientific" mode
3. if a broader layer is explored, document it first as a `guided/discovery` proposal with
   confidence labeling and explicit non-goals
4. require a separate evidence/rights review before exposing broader category-level guidance in the
   public API

## Follow-Up Questions

These questions remain open and should be answered before any future guided/discovery lane is
implemented:

1. What confidence labels should be exposed publicly, if any?
2. Should guided outputs live in the same endpoint family as strict outputs, or be clearly split?
3. Which future categories, if any, are allowed into a guided lane before food-level strict proof
   exists?
4. How should onboarding explain the difference between strict and guided outputs without increasing
   user anxiety?
5. Should this direction eventually become a PRD or ADR once the product decision is accepted?
