# Turborepo Scale Playbook

This playbook distills patterns from three large OSS Turborepo users.

## Source Snapshots

- `calcom/cal.com` at `4081d11fbec98a4267f6946877cc138a1a24505b`
- `payloadcms/payload` at `8791a726d6c7a516811c77ce785f0673f6729378`
- `dubinc/dub` at `2c74ee86ac0ddae01d5226a15d0c7afa63c81496`

## Cross-Repo Patterns

1. Preserve existing Turborepo generation style.
   - `cal.com` and `payload` use `tasks`.
   - `dub` uses legacy `pipeline`.
   - Rule: keep existing style unless migration is explicitly requested.

2. Build tasks define outputs; dev tasks avoid cache.
   - Artifact-producing tasks define `outputs`.
   - Dev/watch/cleanup tasks often use `cache: false`.
   - Rule: tune caching per task semantics, not globally.

3. Filters are core for scale.
   - All three repos use targeted `--filter` strategies.
   - `payload` heavily uses include/exclude filters for package subsets.
   - Rule: replace broad monorepo runs with focused filters when possible.

4. Environment and cache boundaries must be explicit.
   - `cal.com` uses task-level `env` and `inputs` for env-file invalidation.
   - Rule: if env or files impact output, encode them in `env`/`inputs`.

5. CI remote cache integration is explicit when used.
   - `cal.com` workflows repeatedly pass `TURBO_TOKEN` and `TURBO_TEAM`.
   - Rule: in CI, prefer explicit credential wiring over implicit behavior.

## Migration Guardrails

When modernizing existing repos:

1. Do not combine style migration and feature changes in one PR.
2. Keep script style (`turbo run` vs `turbo`) consistent within the repo.
3. Preserve cache behavior unless there is a measured reason to change it.
4. Add comments only where behavior is non-obvious.

## When To Read Repo-Specific Notes

- Need high-env, multi-app orchestration: read `repo-calcom.md`
- Need package-matrix build/release strategy: read `repo-payload.md`
- Need legacy `pipeline` compatibility patterns: read `repo-dub.md`
