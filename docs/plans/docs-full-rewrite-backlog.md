# Docs Full Rewrite Backlog (Deferred)

Last updated: 2026-03-04
Status: Planned (deferred)

## Why Deferred

The current pass focuses on targeted public-readiness cleanup to avoid coupling a broad information-architecture rewrite to immediate repository hardening and contributor intake controls.

Foundation canon now lives in `docs/foundation/`; future IA work should build routing and
placement rules on top of that canon rather than redefining project identity or documentation
personas.

## Rewrite Goals (Future Pass)

1. Redesign `/docs` information architecture with clear owner boundaries.
2. Reduce legacy transition artifacts in active paths.
3. Introduce consistent status/metadata headers across doc families.
4. Consolidate overlapping planning documents.
5. Improve newcomer navigation from root `README.md` to task-specific runbooks.

## Candidate Scope

- Reorganize sections (`architecture`, `ops`, `plans`, `transition`, `frontend`, `research`, `archive`).
- Define canonical document naming and lifecycle rules.
- Standardize templates for ADRs, runbooks, and project plans.
- Prune or archive stale documents based on explicit retention criteria.

## Out Of Scope For Current Pass

- Full relocation or deletion of large legacy doc sets.
- Bulk rewrites of historical planning content.
- Reframing ADR semantics outside existing accepted/implemented statuses.

## Completion Criteria For Future Rewrite

1. Updated `docs/README.md` reflects final IA and ownership model.
2. No duplicate active/historical files without explicit canonical markers.
3. Every key operational domain has one canonical runbook.
4. Link integrity check passes across rewritten docs.
5. Migration notes exist for renamed/moved high-traffic documents.
