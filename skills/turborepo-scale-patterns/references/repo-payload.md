# Pattern Notes: payloadcms/payload

## Snapshot

- Repo: `payloadcms/payload`
- Commit: `8791a726d6c7a516811c77ce785f0673f6729378`
- Files reviewed:
  - `turbo.json`
  - `package.json`
  - `.github/workflows/*`

## Observed Patterns

1. Compact `tasks` graph, broad script matrix.
   - `turbo.json` keeps a small set of core tasks (`build`, `lint`, `clean`, variants).
   - `package.json` provides extensive package-targeted commands.

2. Heavy use of include/exclude filters.
   - Uses positive filters (`@payloadcms/...`) and negative filters (`!blank`, `!website`).
   - Enables selective build subsets across many packages.

3. Deterministic rebuild paths when needed.
   - Certain scripts use `--no-cache --force` for trusted rebuilds in critical flows.

4. Parallel lint with continuation.
   - Lint scripts use `turbo run ... --continue` with filters to maximize signal collection.

## Reusable Guidance

1. Keep `turbo.json` focused; fan out specialization in scripts when it improves operability.
2. Use exclude filters to keep CI and local loops fast.
3. Reserve forced no-cache commands for critical release/debug paths.
4. Prefer explicit script names for operational discoverability.
