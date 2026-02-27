# Mobile Onboarding PRD (France V1)

Last updated: 2026-02-27
Owner: Product + Mobile + Data + Legal
Status: Draft for implementation planning

## 1. Objective

Design a France-first onboarding flow for the mobile app that:

1. delivers first user value fast (`first_swap_rendered`),
2. keeps low-FODMAP guidance clinically safe and phase-based,
3. satisfies FR/EU privacy and consent expectations for health-context usage,
4. aligns with current repository contracts and API capabilities.

## 2. Scope (V1)

In scope:

1. First-run onboarding for France (`fr-FR`) on mobile.
2. Safety messaging, age gate, consent collection, profile bootstrap, first swap experience.
3. Event taxonomy and KPI definitions.
4. Functional requirements and acceptance criteria for design/engineering handoff.

Out of scope:

1. Full care-pathway features (teleconsultation, clinician portal).
2. Barcode-first onboarding as primary path.
3. Family/guardian consent workflow for minors.
4. EN locale rollout.

## 3. Locked Product Decisions (V1)

1. Market/language: France only, UI copy in French only.
2. Positioning: wellbeing/self-management support, not diagnosis/treatment.
3. Minors policy: users under 15 are blocked in V1.
4. North-star activation event: `first_swap_rendered`.
5. Performance KPI: p50 `<= 60s` from `consent_health_completed` to `first_swap_rendered`.
6. Onboarding shape: activation-first with mandatory safety/compliance gates.

## 4. Contract Alignment (Current Repo)

This PRD assumes and aligns with:

1. `/v0/foods` search by query and slug resolution.
2. `/v0/swaps` active-only swaps with required `from` and deterministic sorting.
3. `/v0/foods/{food_slug}/rollup` and `/subtypes` for uncertainty explanation.
4. FR/EN fields present in API; app should prioritize FR fields in V1.
5. Existing consent/analytics gating model in app scaffold.

Reference files:

1. `api/openapi/v0.yaml`
2. `api/app/sql.py`
3. `apps/app/lib/i18n.ts`
4. `apps/app/lib/consent.ts`
5. `apps/app/lib/analytics.ts`
6. `docs/transition/current-state-snapshot.md`

## 5. Onboarding Flow (V1)

## Step 1: Safety and Intent

Goal: establish medical boundaries before recommendations.

UI content:

1. App is informational support, not medical diagnosis.
2. Red-flag warning text with "consult urgent care/doctor" guidance.
3. Short statement that strict low-FODMAP is temporary and phase-based.

Primary action: `Continuer`.

Acceptance criteria:

1. User cannot proceed without explicit acknowledgment checkbox.
2. No recommendations shown before acknowledgment.
3. Event emitted: `onboarding_safety_acknowledged`.

## Step 2: Age Gate + Health Data Consent

Goal: enforce V1 age policy and explicit consent for health-context personalization.

UI content:

1. Age confirmation (`15+` required).
2. Explicit consent request for health-data collection/use in personalization, symptom logging, and history.
3. Consent text is unbundled from CGU/ToS acceptance and links to privacy notice/legal basis summary.
4. Contextual notice summarizing data categories, purposes, retention, and withdrawal rights.

Branching:

1. If age `< 15`: stop flow, show blocked state and support contact.
2. If consent granted: set `flow_mode=personalized` and continue full onboarding.
3. If consent declined: set `flow_mode=discovery`, skip Step 5, disable all health-data writes (symptoms, stool pattern, meal logs, swap history, profile persistence), and continue with read-only discovery.

Acceptance criteria:

1. Under-15 users cannot continue onboarding in V1.
2. Consent is unbundled from CGU/ToS acceptance (no bundled checkbox, no pre-check).
3. Consent decision is stored with timestamp, policy version, and consent text version.
4. In `discovery` mode, onboarding never prompts symptom burden or stool pattern inputs.
5. Event emitted on completion: `consent_health_completed`.

## Step 3: Analytics Consent (Separate, Optional)

Goal: separate product usage analytics consent from health-data consent.

UI content:

1. Optional analytics consent with plain-language purpose.
2. Continue path does not require analytics opt-in.
3. Link to modify consent later.

Acceptance criteria:

1. Refusal does not block onboarding progression.
2. Non-essential analytics events are disabled when refused.
3. Event properties are serialized as strings to align with analytics runtime contract.
4. Event emitted: `consent_analytics_updated`.

## Step 4: Goal and Phase Selection

Goal: route user to relevant first actions.

Required inputs:

1. Goal:
   1. `Trouver des alternatives rapidement`
   2. `Commencer l'eviction`
   3. `Commencer la reintroduction`
   4. `Personnaliser mon alimentation`
2. Current phase:
   1. `Je ne sais pas`
   2. `Eviction`
   3. `Reintroduction`
   4. `Personnalisation`
3. Clinical safety-check prompt: `Avez-vous un diagnostic de SII confirme et une exclusion de la maladie coeliaque ?`

Acceptance criteria:

1. Both selections required to continue.
2. If answer is `non` or `je ne sais pas`, show non-blocking clinician guidance and disable guided reintroduction planning until acknowledged.
3. Event emitted: `onboarding_goal_phase_selected`.

## Step 5: Quick Baseline Profile

Goal: gather minimum useful context without long questionnaire in personalized mode only.

Precondition: `flow_mode=personalized`.

Inputs (max 60 seconds target):

1. Top 1-3 trigger categories (multi-select).
2. Current symptom burden (simple 5-level scale).
3. Optional stool pattern category (skip allowed).
4. Dietary constraints (vegetarian, vegan, lactose-free, gluten-free) as quick multi-select.

Acceptance criteria:

1. Step is shown only when health-data consent is granted.
2. Step can be completed in <= 3 taps for minimal path.
3. "Skip optional" is available for non-required fields.
4. No profile values are persisted when `flow_mode=discovery`.
5. Event emitted: `onboarding_profile_completed` (personalized mode only).

## Step 6: Plan Preview (3-Phase Framing)

Goal: set expectations for the 3-phase low-FODMAP process before recommendations.

Content requirements:

1. Phase 1 is temporary (typical 2-6 weeks).
2. Phase 2 reintroduction uses structured single-FODMAP challenges (3 days each with breaks).
3. Phase 3 personalization expands variety and is the long-term goal.

Acceptance criteria:

1. Copy avoids prescriptive medical language and uses the approved French framing.
2. Content is skippable but viewable before first swap.
3. Event emitted: `onboarding_plan_preview_viewed`.

## Step 7: First Value (Search -> Swap)

Goal: deliver first useful recommendation immediately.

Flow:

1. Search food (`/v0/foods?q=...`).
2. User selects food slug.
3. Fetch swaps using `/v0/swaps?from=<slug>&min_safety_score=0.5&limit=10`.
4. Render ranked swaps with French labels/instructions.
5. In `discovery` mode, keep search/swap interaction available but do not persist user history.
6. Display data freshness in swap detail or info sheet (for example `scoring_version` and `rollup_computed_at`).

Fallback behavior:

1. If no swaps: show no-result state with next actions (related foods, broaden search, save for later).
2. If uncertainty high (`overall_level=unknown` or low coverage indicators), show uncertainty badge and cautious wording.

Acceptance criteria:

1. Event emitted on first query: `first_food_search_submitted`.
2. Event emitted when swaps shown: `first_swap_rendered`.
3. `elapsed_ms_from_consent_health` is emitted as a stringified integer on events that include elapsed time.
4. p50 elapsed time from `consent_health_completed` to `first_swap_rendered` <= 60s.
5. No "safe guaranteed" language in uncertainty states.

## Step 8: Optional Account and Permissions

Goal: request only after value is delivered.

Optional actions:

1. Create/sign in account for sync/history/export.
2. Enable reminders (notifications).
3. Enable camera for barcode (if enabled later).

Acceptance criteria:

1. Skip path must preserve completed onboarding state.
2. Notification/camera prompts are just-in-time, not first-launch mandatory.
3. Event emitted: `onboarding_completed`.

## 6. Functional Requirements

`ONB-FR-001` Must: App onboarding copy and controls are French (`fr-FR`) only in V1.

`ONB-FR-002` Must: Safety acknowledgment gate appears before any recommendation output.

`ONB-FR-003` Must: Age gate blocks users under 15 from onboarding in V1.

`ONB-FR-004` Must: Health-data consent is explicit, unbundled from CGU/ToS acceptance, versioned, and auditable.

`ONB-FR-005` Must: If health consent is declined, app falls back to `discovery` mode with no health-data writes.

`ONB-FR-006` Must: Analytics consent is separate from health consent, optional, and refusal never blocks core usage.

`ONB-FR-007` Must: Non-essential analytics/SDK runtimes remain disabled until purpose-scoped consent is granted.

`ONB-FR-008` Must: Contextual privacy notice appears at first collection point for each health-data type.

`ONB-FR-009` Must: First-value flow uses product default `min_safety_score=0.5`.

`ONB-FR-010` Must: Search/swap flow uses active-only API behavior and existing deterministic sort order.

`ONB-FR-011` Must: Uncertainty messaging appears for unknown/low-confidence states.

`ONB-FR-012` Must: Account creation is optional and can be skipped.

`ONB-FR-013` Must: Permission prompts are runtime/contextual and denial leaves core flow functional.

`ONB-FR-014` Must: p50 time from `consent_health_completed` to `first_swap_rendered` <= 60s.

`ONB-FR-015` Should: p75 onboarding completion <= 4 minutes for full path.

`ONB-FR-016` Must: Accessibility baseline WCAG 2.2 AA on onboarding screens.

`ONB-FR-017` Must: Consent withdrawal path exists in settings with clear effect statement.

`ONB-FR-018` Must: Data export and deletion path exists in settings (stub allowed in V1 with explicit status messaging).

`ONB-FR-019` Must: Data retention policy is defined and enforced for account deletion and inactivity windows.

`ONB-FR-020` Must: Hosting/compliance decision gate is closed before production launch, including whether HDS applies.

`ONB-FR-021` Must: Onboarding copy states low-FODMAP as a 3-phase process with temporary elimination phase (typically 2-6 weeks).

`ONB-FR-022` Must: Reintroduction is described as structured single-FODMAP challenges (3 days each with breaks).

`ONB-FR-023` Must: Copy states strict elimination is not intended long term and transitions to reintroduction are required when appropriate.

`ONB-FR-024` Should: Copy encourages clinician/dietitian support and advises consultation if symptoms do not improve after Phase 1.

`ONB-FR-025` Must: Safety check includes "diagnostic SII confirme + exclusion maladie coeliaque" wording before guided plan actions.

`ONB-FR-026` Must: Collect dietary constraints in personalized mode to filter swaps (vegetarian, vegan, lactose-free, gluten-free).

`ONB-FR-027` Must: Plan preview step is shown before first swap and includes the 3-phase framing with timing hints.

`ONB-FR-028` Must: Swap detail or info sheet displays data freshness (for example `scoring_version` and `rollup_computed_at`).

## 7. Data and Compliance Requirements (France/EU)

The following are product requirements pending legal validation:

1. Treat symptom logs, diet logs, and personalized tolerance history as health-context data requiring explicit consent handling.
2. Legal basis and processing records must document special-category handling (Article 9 GDPR context) for the selected product positioning.
3. Health-data consent must be explicit and separate from CGU/ToS acceptance; no bundled acceptance.
4. Consent purposes are granular (health personalization vs analytics) and independently revocable.
5. Contextual notices must appear at first collection point for each health-data type.
6. OS permissions are not consent substitutes; permission denial must provide non-blocking alternatives.
7. Consent receipts must include timestamp, consent text version, policy version, and purpose flags.
8. Withdrawal must be simple, available in settings, and effective without coercion.
9. Minors policy for V1 blocks `<15`; legal review must validate this against France-specific obligations.
10. Data minimization applies to onboarding inputs; only data needed for first value and safe guidance is collected.
11. Retention/deletion policy must cover account deletion and inactivity handling.
12. Data export/deletion rights must be accessible from settings.
13. Hosting/compliance decision gate must explicitly resolve whether HDS obligations apply for production scope.

Release gate:

1. Legal approval required for final copy, consent model, and processing-register mapping before production launch.
2. Compliance checklist approval required for consent withdrawal, retention, export/delete, and minors path behavior.

## 8. Event Taxonomy (V1)

Core events:

1. `onboarding_started`
2. `onboarding_safety_acknowledged`
3. `consent_health_completed`
4. `consent_analytics_updated`
5. `onboarding_goal_phase_selected`
6. `onboarding_profile_completed`
7. `onboarding_plan_preview_viewed`
8. `first_food_search_submitted`
9. `first_swap_rendered`
10. `onboarding_completed`
11. `onboarding_dropped`

Required event properties:

1. All event properties are strings (implementation contract aligns with `apps/app/lib/analytics.ts`).
2. Numeric values are stringified integers/decimals (for example `elapsed_ms_from_consent_health="48231"`).
3. Boolean states are string enums (`granted`/`denied`, `yes`/`no`) instead of true/false values.
4. Canonical event names are the IDs defined in this section; do not emit deprecated `onb_*` aliases.

Common properties (send when available):

1. `step_id`
2. `flow_mode` (`personalized` or `discovery`)
3. `consent_health` (`granted` or `denied`)
4. `consent_analytics` (`granted` or `denied`)
5. `phase_selected`
6. `goal_selected`
7. `elapsed_ms_from_consent_health`

Per-event required properties:

| Event                            | Required properties                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `onboarding_started`             | `step_id`, `flow_mode`                                                                                       |
| `onboarding_safety_acknowledged` | `step_id`, `flow_mode`                                                                                       |
| `consent_health_completed`       | `step_id`, `flow_mode`, `consent_health`                                                                     |
| `consent_analytics_updated`      | `step_id`, `flow_mode`, `consent_analytics`                                                                  |
| `onboarding_goal_phase_selected` | `step_id`, `flow_mode`, `goal_selected`, `phase_selected`                                                    |
| `onboarding_profile_completed`   | `step_id`, `flow_mode`                                                                                       |
| `onboarding_plan_preview_viewed` | `step_id`, `flow_mode`                                                                                       |
| `first_food_search_submitted`    | `step_id`, `flow_mode`, `query_length`                                                                       |
| `first_swap_rendered`            | `step_id`, `flow_mode`, `from_food_slug`, `swap_count`, `min_safety_score`, `elapsed_ms_from_consent_health` |
| `onboarding_completed`           | `step_id`, `flow_mode`, `completion_step`                                                                    |
| `onboarding_dropped`             | `step_id`, `flow_mode`, `drop_reason`                                                                        |

## 9. KPI Definitions

Primary KPIs:

1. Activation rate: users with `first_swap_rendered` / users with `onboarding_started`.
2. Speed-to-value: p50 elapsed from `consent_health_completed` to `first_swap_rendered`.
3. Onboarding completion rate.

Secondary KPIs:

1. D1 and D7 retention for activated users.
2. First-week swap adoption count per activated user.
3. First-search no-result rate.
4. Consent acceptance rates (health and analytics separately).

Guardrail KPIs:

1. Under-15 block rate.
2. Unknown/uncertainty exposure rate.
3. Red-flag warning exposure rate.

## 10. UX Content Constraints (French Copy)

Copy requirements for design/content:

1. Use "SII" and "regime pauvre en FODMAP" terminology consistently in French copy.
2. Avoid diagnosis/treatment claims.
3. Avoid deterministic safety claims where uncertainty exists.
4. State the 3-phase model and "temporary elimination phase" in plain French (typical 2-6 weeks).
5. Describe reintroduction as structured challenges (3 days each with breaks).
6. State that strict elimination is not long-term and personalization follows reintroduction.
7. Include clear escalation copy ("ceci ne remplace pas un avis medical") and clinician guidance if symptoms persist.
8. Use metric units and French locale formatting.
9. Keep medical escalations clear and short.

## 11. Edge Cases and Fallbacks

1. API unavailable: show retry and offline-safe state; do not crash onboarding session.
2. No matching food search: suggest spelling variants and common alternatives.
3. No swap returned: show graceful fallback with additional suggestions.
4. Unknown rollup: show uncertainty badge and cautionary text.
5. Health consent refused: continue in read-only discovery mode and suppress all health-data writes.
6. Consent revoked mid-session: disable affected features and confirm impact.

## 12. Release Gates

Gate A: Product/Design

1. All mandatory steps and branches implemented.
2. Full screen-level QA for iOS and Android.

Gate B: Data/API

1. Contract checks pass against `api/openapi/v0.yaml`.
2. Swap rendering handles sparse/no-result cases with no blocking errors.

Gate C: Compliance

1. Legal copy approved.
2. Consent records and withdrawal mechanics validated.
3. Minors policy behavior validated.

Gate D: Quality

1. Accessibility checks pass.
2. Crash-free onboarding session target met in beta.
3. KPI instrumentation validated in staging.

## 13. Open Questions

1. Is discovery mode (when health consent denied) legally acceptable for V1 scope as designed?
2. Do we include stool-pattern input in V1 or defer to reduce friction?
3. Should reminder opt-in be requested at end of onboarding or after first successful week?
4. What legal wording is approved for red-flag guidance in French?
5. What inactivity duration is approved for retention cutoff in V1?

## 14. Source References Used for This PRD

Clinical and guidance references:

1. American College of Gastroenterology low-FODMAP overview.
2. Monash University FODMAP process guidance.
3. AGA Clinical Practice Update (IBS diet management).
4. NICE IBS guideline recommendations.
5. World Gastroenterology Organisation guidance (French diet-and-gut section).
6. French clinical references for IBS framing and exclusions.

Privacy and compliance references:

1. CNIL GDPR chapter and legal bases for consent.
2. CNIL mobile health app guidance (special-category data handling).
3. CNIL recommendations for mobile app permissions, consent granularity, and contextual notices.
4. CNIL consent withdrawal guidance and minors consent age framework.

UX/platform references:

1. Nielsen Norman Group progressive disclosure guidance.
2. Material onboarding pattern guidance.
3. Android runtime permissions guidance.
4. Apple App Review Guidelines and Google Play medical functionality policy.

Note: legal interpretation and country-specific obligations must be confirmed by qualified counsel before production release.
