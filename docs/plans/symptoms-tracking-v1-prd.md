# Symptoms Tracking V1 PRD

Last updated: 2026-03-13  
Owner: Product + App + Mobile + API  
Status: Draft

Related docs:

- `docs/research/safe-harbor-mode-framing-2026-03-13.md`
- `docs/foundation/project-definition.md`
- `docs/frontend/strategy.md`

## 1. Objective

Add a first tracking lane to FODMAPP that helps users record what they eat and how they feel,
without weakening the strict evidence-backed food layer.

Tracking V1 is not a diagnostic engine. It is a structured journal and pattern-review tool.

## 2. Product position

FODMAPP should evolve toward three distinct product lanes:

1. `Strict`
   Evidence-backed food logic such as swaps and Safe-Harbor V1.
2. `Guided`
   Future onboarding, discovery, and lower-confidence assistance with explicit uncertainty.
3. `Tracking`
   Structured self-observation: meals, symptoms, and simple summaries.

Tracking must remain separate from strict food classification.

## 3. Platform decision

Tracking should be built for **both web and mobile**, with different jobs on each surface.

### Mobile role

Mobile is the primary capture surface:

1. fast symptom logging
2. meal logging
3. reminders and recent-entry reuse later
4. optional device integrations later

### Web role

Web is the primary review and management surface:

1. history and timeline review
2. edits and corrections
3. summary views
4. account and export management later

### Apple Health / HealthKit

Apple Health should be treated as a **future optional iOS integration**, not as the system of
record.

V1 policy:

1. no HealthKit dependency
2. app database remains the source of truth
3. HealthKit can be evaluated later for optional import/export of adjacent health context such as
   sleep or activity

## 4. Core product decisions

### 4.1 Logging model

Tracking V1 should be **manual-first**.

Meals should support both:

1. linking to foods already in the FODMAPP database
2. creating personal custom entries when the food is not in the database

Important distinction:

1. custom entries are personal logs, not canonical food-database records
2. custom entries may later feed a suggestion/review workflow, but they are not auto-promoted into
   the shared food knowledge base

### 4.2 Symptom severity scale

Use a numeric severity scale of **0 to 10** as the stored value.

UI recommendation:

1. present a friendly visual aid, for example 5 mood or comfort faces
2. map that visual aid onto the underlying 0-10 scale

Why:

1. numeric storage is more flexible for summaries and future analysis
2. the visual aid makes entry faster and less clinical

### 4.3 Bowel tracking

Bowel tracking should **not be required** for V1.

Recommendation:

1. keep it out of the core happy path
2. either defer it or include it as an optional secondary field

Reason:

1. it is useful for some users
2. but it increases sensitivity and logging friction
3. V1 should optimize for regular use first

### 4.4 Data ownership

Tracking should be **account-backed from day one**, with **local-first UX behavior**.

Meaning:

1. canonical data lives in the app account/backend
2. clients should cache locally and feel fast/offline-friendly
3. sync is expected across devices and platforms

Why this is the recommended default:

1. web + mobile tracking is much less useful if data does not sync
2. users expect history to survive device changes
3. future summaries and personalization are easier with one canonical dataset
4. it avoids a painful migration from local-only storage later

### 4.5 Insights in V1

Tracking V1 should ship with **raw history + basic summaries**, not causal insights.

Good V1 outputs:

1. timeline/history
2. recent symptom frequency
3. recent meal and symptom proximity views
4. simple daily or weekly summaries

Explicitly out of scope for V1:

1. automatic trigger scoring
2. claims that a food caused a symptom
3. predictive risk scoring
4. clinician-style interpretation

## 5. V1 scope

### In scope

1. manual meal logging
2. meal entries linked to canonical foods when possible
3. personal custom meal or food entries when needed
4. symptom event logging
5. symptom severity `0-10`
6. timestamped notes
7. basic history/timeline view
8. basic summaries such as daily or weekly counts and simple trends
9. sync between web and mobile through account-backed storage

### Nice to have if cheap

1. recent meals or recent symptom shortcuts
2. reusable meal templates
3. optional bowel field behind a secondary UI affordance

### Out of scope

1. automated trigger detection
2. medical or diagnostic claims
3. HealthKit integration
4. clinician reporting workflows
5. barcode-driven meal logging
6. automatic promotion of custom foods into the canonical food DB

## 6. User-facing framing

Tracking copy should frame this as:

1. self-observation
2. pattern review
3. a personal record the user can review over time

Avoid:

1. diagnostic language
2. certainty language
3. causal claims such as “this food caused your symptoms”
4. any implication that the app can prove triggers from V1 logs

## 7. Suggested event model

### Meal log

Suggested fields:

1. timestamp
2. meal type (optional)
3. linked canonical food IDs when available
4. custom text entry when needed
5. note

### Symptom log

Suggested fields:

1. timestamp
2. symptom type
3. severity `0-10`
4. optional note

### Optional later context fields

Candidates for later, not necessarily V1:

1. sleep
2. stress
3. menstrual cycle
4. medication
5. bowel pattern

## 8. Data and contract principles

1. Tracking data is user-observation data, not evidence-backed food truth.
2. Tracking data must not silently override strict food classifications.
3. Personal custom food entries remain separate from the canonical shared food catalog.
4. If future insights are added, the product must clearly distinguish:
   - evidence-backed food logic
   - observed user history
   - heuristic or personalized suggestions

## 9. V1 UX shape

Recommended first UX:

1. `Add meal`
2. `Add symptom`
3. `History`
4. `Weekly summary`

Recommended default behavior:

1. mobile optimized for fast entry
2. web optimized for review and correction
3. visual severity scale for faster symptom entry

## 10. Risks and mitigations

### 10.1 Overclaiming causality

Risk:

Users may assume correlations in the journal equal proof.

Mitigation:

1. no causal copy in V1
2. no trigger scoring in V1
3. summaries stay descriptive, not interpretive

### 10.2 Logging friction

Risk:

Too many required fields will reduce usage.

Mitigation:

1. manual-first
2. only a small number of required fields
3. optional bowel tracking
4. recent-entry shortcuts later

### 10.3 Canonical-data pollution

Risk:

Custom meal entries could blur into the canonical food knowledge base.

Mitigation:

1. keep personal custom entries separate from canonical foods
2. use a later review/suggestion flow for promotion, not auto-ingestion

### 10.4 Sync complexity

Risk:

Cross-platform tracking becomes unreliable if storage starts local-only.

Mitigation:

1. account-backed canonical storage from day one
2. local-first cache and sync behavior on clients

## 11. Acceptance criteria

1. Users can record a meal manually on mobile and web.
2. Meals can link to known foods or fall back to personal custom entries.
3. Users can log symptoms with a stored `0-10` severity.
4. V1 presents history and simple summaries without causal claims.
5. Tracking data remains separate from strict food evidence contracts.
6. No HealthKit dependency is required for V1.

## 12. Follow-up after this PRD

The next useful artifacts would be:

1. a small data-model note for tracking events
2. an API/storage contract note
3. a mobile/web UX sketch for capture vs review responsibilities
