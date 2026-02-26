# Phase 2 Reporting Module

Execution contract for planning-only implementation artifacts in this worktree.

- Committed contracts and baselines live under `contracts/`.
- Runtime artifacts are emitted under `out/runs/<run_id>/`.
- PR smoke is fixture-only (`collect_reporting.py --source fixture`).
- Full runs use replay+seed and collect now-set figures from DB extractors (`collect_reporting.py --source db`).
- `run.json` and replay manifests are redacted: DB targets are stored as `db://<host>/<database>` only (no credentials/DSN query params), and replay step logs persist bounded `error_hint` only on failures.
- Baseline refresh is controlled via `workflow_dispatch baseline_update=true` and performs real baseline + stage-contract refresh in allowlisted paths only.
- Baseline compare defaults to semantic scope (`compare_baselines.py --compare-scope semantic`).
- Renderers are owned by `@fodmap/reporting` and consume only canonical reporting JSON (`run.json` or committed now baseline).
- Scientific SVG and standalone HTML render baselines are committed under `contracts/baselines/render/v1/`.
- Render baseline manifest is validated against `contracts/schema/render_baseline_manifest.schema.json`.
- PR smoke includes blocking renderer compare against committed render manifest; full replay render compare remains non-blocking ramp.

See:

- `contracts/reporting_snapshot_policy.yaml`
- `contracts/schema/*.schema.json`
- `tests/fixtures/now-set/query-results/`
- `../../../../.github/workflows/phase2-reporting.yml`
