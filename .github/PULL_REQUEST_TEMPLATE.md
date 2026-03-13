## Summary

- What changed?

## Documentation Governance

Documentation audience:
Canonical document(s):
Lifecycle status after merge:
Supersedes / archives:

If this PR does not touch canonical documentation, write `N/A` for each field above.

## Validation

- [ ] `./.github/scripts/quality-gate.sh --full` executed locally
- [ ] `pnpm lint:ci` (including warnings as failures)
- [ ] `pnpm lint:llm` for agent-generated code paths (if applicable), with findings fixed before merge
- [ ] `pnpm python:ci` for Python path changes
- [ ] `pnpm openapi:check` for OpenAPI contract changes
- [ ] `./.github/scripts/ci-api-pr.sh` for DB-auth-sensitive API test/helper changes
- [ ] If using changeset exemption path, this PR has the `changeset-exempt` label and only allowlisted prototype packages are touched
- [ ] No secrets introduced

## Contract Impact

- Any breaking changes?
- Any migration needed?

## Changesets

- If this PR changes `apps/*` or `packages/*`, include a corresponding `.changeset/*.md` file.
- Reference: `.changeset` governance is required for package/app surface changes.
- Exemption path: only allowlisted prototype packages may skip `.changeset`; PR must include `changeset-exempt`.
