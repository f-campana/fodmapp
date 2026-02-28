---
"fodmap-platform": patch
---

Make changeset coverage validation deterministic in local/CI gate flows by deriving coverage from git diff and changed `.changeset` frontmatter, add checker unit tests, and skip full pre-push gate on delete-only pushes.
