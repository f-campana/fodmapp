# Pattern Notes: dubinc/dub

## Snapshot

- Repo: `dubinc/dub`
- Commit: `2c74ee86ac0ddae01d5226a15d0c7afa63c81496`
- Files reviewed:
  - `turbo.json`
  - `package.json`
  - `.github/workflows/*`

## Observed Patterns

1. Legacy `pipeline` schema is still in production use.
   - `turbo.json` defines `pipeline` with `build`, `dev`, `clean`, `test`.
   - `dev` is `persistent` and `cache: false`.

2. Negative output glob for Next.js cache.
   - `build.outputs` excludes `.next/cache/**` while caching `.next/**` and `dist/**`.

3. Script style favors shorthand `turbo build`.
   - Most scripts use shorthand (`turbo build`, `turbo dev`, `turbo lint`).
   - Targeted publish scripts apply `--filter` then package-local publish steps.

4. Focused automation via package manager filters.
   - Workflows also leverage `pnpm --filter` for targeted jobs.

## Reusable Guidance

1. Preserve legacy schema compatibility when already stable.
2. Use output exclusions to prevent noisy, low-value cache artifacts.
3. Keep release scripts focused to a package and its build path.
4. Do not force command-style migrations unless explicitly requested.
