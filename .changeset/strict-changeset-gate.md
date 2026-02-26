---
"fodmap-platform": patch
---

Add governance and contributor-facing updates that enforce changeset requirements for package/app changes, including:

- PR validation gate to fail package/app changes without an accompanying `.changeset` file.
- Release automation workflow to generate versioning PRs from queued changesets.
- Contributor checklist and workspace-local quality gate hardening for release preparation.
