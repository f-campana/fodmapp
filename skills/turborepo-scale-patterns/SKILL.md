---
name: turborepo-scale-patterns
description: |
  Turborepo patterns extracted from large, active OSS monorepos. Use this skill
  when designing or refactoring turbo.json task graphs, build/lint/test scripts,
  package filters, caching, or CI behavior in medium/large workspaces.

  Triggers: turbo.json changes, package.json scripts using turbo, CI workflows
  with Turborepo, cache misses, over-building, and monorepo scaling work.
---

# Turborepo Scale Patterns

Use this as a practical overlay on top of official Turborepo guidance.

## Required Load Order

1. Read `../turborepo-official/SKILL.md` first for canonical behavior.
2. Read `references/scale-playbook.md` for cross-repo patterns.
3. Read one or more repo-specific notes only as needed:
   - `references/repo-calcom.md`
   - `references/repo-payload.md`
   - `references/repo-dub.md`

If `../turborepo-official/` is unavailable, use upstream:
`https://github.com/vercel/turborepo/tree/main/skills/turborepo`.

## Workflow

1. Classify current repo style.
   - Detect config generation: `tasks` vs legacy `pipeline`.
   - Detect script style used in-repo: `turbo run` vs shorthand `turbo`.
   - Detect workspace/package manager conventions already in place.
2. Preserve style unless the user asks to migrate.
   - Do not force `pipeline` -> `tasks` migration opportunistically.
   - Do not rewrite every script style in one pass unless explicitly requested.
3. Apply scale-safe task graph rules.
   - Build tasks should declare stable `outputs`.
   - Long-running dev/watch tasks should be `cache: false` and, when needed, `persistent`.
   - Use `dependsOn` for correctness before optimization.
4. Apply targeted execution patterns.
   - Use `--filter` for package-level precision in local/CI/release workflows.
   - Use include and exclude filters intentionally for large matrices.
5. Apply cache and env boundaries.
   - Put env vars that affect artifacts into task `env`.
   - Include env files in task `inputs` when file changes must invalidate cache.
   - Use remote cache credentials in CI where available.
6. Report decisions.
   - State what pattern was applied and why.
   - State risks/tradeoffs when preserving legacy behavior.

## Hard Rules

1. Optimize for incremental correctness, not broad rewrites.
2. Keep proposals consistent with the existing codebase style unless instructed otherwise.
3. Use repo evidence from references; avoid inventing unverified conventions.
4. Prefer small, reviewable diffs over repo-wide normalization passes.

## Primary References

- `references/scale-playbook.md`
- `references/repo-calcom.md`
- `references/repo-payload.md`
- `references/repo-dub.md`
