# FODMAPP Project Definition

Status: Implemented
Owner: Maintainer / Product
Last reviewed: 2026-03-08

## One-line definition

FODMAPP is a documentation-first, evidence-backed platform-in-construction for low-FODMAP
self-management support, combining scientific data workflows, a read-only API, frontend
foundations, and mobile prototypes in one monorepo.

## What It Is

FODMAPP is a personal and household-oriented project that turns curated FODMAP evidence and
review-gated food data into usable product surfaces.

Today, the repository is strongest as a platform and delivery system:

- Phase 2 and Phase 3 SQL and reporting workflows
- a read-only FastAPI service with generated contract types
- shared UI, tokens, and Storybook foundations
- app and mobile scaffolds for future product delivery
- repo governance and operational contracts for safe iteration

The intended product direction is a France-first, safety-conscious support experience for people
managing low-FODMAP decisions, starting with swaps and onboarding, and later extending toward
personalization.

## What It Is Not

FODMAPP is not:

- a diagnosis or treatment service
- a medical device or clinician-led care platform
- a finished consumer application across all surfaces in this repo
- a generic wellness-content site with no evidence or data contract behind it
- an open-ended public contribution project with unrestricted direct PR intake

## Current Reality

| Surface                       | What it is today                                                                                          | Status    | Audience                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------- |
| Evidence and knowledge engine | Review-gated Phase 2 and Phase 3 SQL, CSV, and reporting workflows producing validated food and swap data | Active    | Maintainers, data operators                     |
| API v0                        | Read-only FastAPI serving foods, rollups, and active swap recommendations                                 | Active    | Contributors, frontend consumers                |
| Shared frontend foundation    | UI library, design tokens, Tailwind contract, Storybook, generated TypeScript types                       | Active    | Frontend contributors                           |
| App surface                   | Next.js scaffold with auth, consent, analytics, and runtime seams                                         | Scaffold  | Product and frontend work                       |
| Mobile surface                | Expo prototype with mock-data UX validation and onboarding experiments                                    | Prototype | Product and design exploration                  |
| Marketing and research sites  | Content scaffolds, not yet mature public product surfaces                                                 | Scaffold  | Internal documentation and future communication |
| Public repo governance        | CI hardening, worktree model, contribution intake, and security or community files                        | Active    | Maintainer, collaborators, public visitors      |

## Value Offered Today

Today FODMAPP offers:

- a deterministic, review-aware FODMAP data workflow
- a stable read-only serving contract for food and swap data
- a frontend foundation that can progress in parallel with data work
- a mobile prototype surface for testing product feel quickly
- a public, documentation-first repo with explicit collaboration and CI rules

## Target Value Later

FODMAPP is aiming to offer:

- France-first low-FODMAP self-management support for adults
- fast first value through food search and safer swap suggestions
- phase-aware guidance that frames low-FODMAP as temporary and structured
- consent-aware personalization, history, and export or share flows
- a practical bridge between evidence rigor and everyday decision support

## Primary Audiences

### Current primary audiences

1. Maintainers and operators responsible for data, contracts, CI, and repository health.
2. Contributors and collaborators building the API, app, UI, and mobile surfaces.
3. Reviewers who need to assess contracts, safety boundaries, and change discipline.

### Target product audience

1. Adults in France seeking low-FODMAP self-management support.
2. People who need quick, lower-risk food alternatives and phase-aware guidance.
3. Users who benefit from structured support without being pushed into medicalized or
   prescriptive product language.

## Secondary Audiences

1. Public visitors evaluating what the project is and whether to engage.
2. Design and product collaborators exploring future flows.
3. Clinicians or supportive third parties who may later consume exports or summaries, but are
   not the primary product audience today.

## Non-goals

For the current project phase, FODMAPP is not trying to be:

- a teleconsultation or clinician-portal product
- a broad international or multi-locale launch
- a complete barcode-first grocery experience
- a full care-pathway product covering diagnosis, treatment, and clinician follow-up
- a repo where every app or package is equally mature or publicly product-ready

## Public Positioning Guardrails

We can safely say:

- FODMAPP is evidence-backed and documentation-first.
- The repo contains active data, API, frontend foundation, and prototype work.
- The product direction is France-first and safety-conscious.
- Some surfaces are production-like contracts, while others are scaffolds or prototypes.

We should not say:

- FODMAPP is a fully launched consumer app.
- FODMAPP provides diagnosis, treatment, or medical advice.
- Every repo surface is equally mature.
- The public repo accepts unrestricted direct code contributions.
- The mobile or product roadmap is already fully shipped.

## Positioning Summary

If we need one short public description, use this:

FODMAPP is a public monorepo for building a low-FODMAP support platform, with review-gated food
data workflows, a read-only API, shared frontend foundations, and early app and mobile product
surfaces.

If we need one short internal description, use this:

FODMAPP is the evidence-to-product delivery system for a future France-first low-FODMAP support
product, with current strength in data, serving contracts, and frontend foundation rather than
fully launched end-user experiences.
