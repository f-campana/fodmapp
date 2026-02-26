# Pattern Notes: calcom/cal.com

## Snapshot

- Repo: `calcom/cal.com`
- Commit: `4081d11fbec98a4267f6946877cc138a1a24505b`
- Files reviewed:
  - `turbo.json`
  - `package.json`
  - `.github/workflows/*`

## Observed Patterns

1. Large `tasks` graph with package-scoped tasks.
   - Mixes root tasks and package tasks like `@calcom/web#build`.
   - Includes many task-specific `env`, `inputs`, and `outputs`.

2. Strong cache boundary modeling.
   - Build-like tasks define `outputs`.
   - Operational tasks (`dev`, `dx`, database and test helpers) are often `cache: false`.

3. High environment cardinality.
   - Extensive `globalEnv`, plus targeted task `env` lists.
   - Env files are included in `inputs` where needed.

4. CI remote cache credentials are explicit.
   - Many workflows set `TURBO_TOKEN` and `TURBO_TEAM`.

5. Filter-heavy orchestration scripts.
   - Root scripts orchestrate subsets with repeated `--filter` usage.
   - Includes package-dependency traversal patterns like `@calcom/web...`.

## Reusable Guidance

1. In high-complexity repos, model cache boundaries per task.
2. Encode env sensitivity directly in task config.
3. Use multi-filter scripts for focused workflows instead of one giant `build`.
4. Keep root scripts as orchestration entrypoints, not business logic containers.
