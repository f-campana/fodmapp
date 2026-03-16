---
name: turborepo-fodmapp-custom
description: |
  Fodmapp-specific Turborepo execution overlay. Use this when working in the
  Fodmapp repository on turbo.json, monorepo scripts, CI workflows, or any change
  that must also honor Fodmapp collaboration, safety, and Phase 3 data contracts.
---

# Turborepo Fodmapp Custom

Use this skill as policy composition:

1. Official Turborepo guidance
2. Large-repo scale patterns
3. Fodmapp repository contract and reporting rules

## Required Load Order

1. `../turborepo-official/SKILL.md`
2. `../turborepo-scale-patterns/SKILL.md`
3. `../turborepo-scale-patterns/references/scale-playbook.md`
4. Local policy references:
   - `references/fodmap-collaboration.md`
   - `references/fodmap-phase3-contract.md`
   - `references/fodmap-reporting-checklist.md`

## Workflow

1. Classify requested change.
   - Turborepo-only change
   - Turborepo plus domain contract impact (swap/scoring/activation/API)
2. Apply Turborepo baseline and scale pattern that matches repo style.
3. Enforce Fodmapp collaboration and safety rules from references.
4. If Phase 3 data surfaces are touched, enforce all Phase 3 contracts.
5. Before merge readiness, execute quality gate and report results.

## Mandatory Operating Rules

1. Branch and PR hygiene:
   - Use short-lived branches from `main`.
   - Keep commit messages in Conventional Commit format.
   - Keep PR titles semantic (Conventional Commit style).
2. Safety:
   - Do not rewrite shared history without explicit request.
   - Avoid destructive git commands unless explicitly approved.
   - Never commit secrets/credentials.
3. Validation:
   - Run `./.github/scripts/quality-gate.sh` before requesting merge.
   - Wait for CI completion and ask before merge when green.
4. Reporting:
   - Always report changed files and why.
   - Always report validation commands and outcomes.
   - Always report residual risks/follow-up.

## Phase 3 Contract Reminder

When change scope touches scoring, swap generation/review/activation, or `/v0/swaps`,
read and enforce `references/fodmap-phase3-contract.md` in full.

## Primary References

- `references/fodmap-collaboration.md`
- `references/fodmap-phase3-contract.md`
- `references/fodmap-reporting-checklist.md`
