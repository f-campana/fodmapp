#!/usr/bin/env bash
set -euo pipefail

mode="${1:-standard}"

print_usage() {
  cat <<'EOF'
Usage: ./.github/scripts/quality-gate.sh [--full|--strict|--all]
  (no args)     Run governance checks only.
  --full|--strict|--all
                Run full local CI parity checks.
EOF
}

if [[ "$#" -gt 1 ]]; then
  echo "[FAIL] too many arguments: $*" >&2
  print_usage >&2
  exit 2
fi

run_full="false"
case "$mode" in
  standard)
    ;;
  --full|--strict|--all)
    run_full="true"
    ;;
  -h|--help)
    print_usage
    exit 0
    ;;
  *)
    echo "[FAIL] unsupported mode: $mode" >&2
    print_usage >&2
    exit 2
    ;;
esac

required_files=(
  ".editorconfig"
  ".gitattributes"
  ".gitignore"
  "AGENTS.md"
  "CONTRIBUTING.md"
  "CODEOWNERS"
  "SECURITY.md"
  ".github/PULL_REQUEST_TEMPLATE.md"
  ".github/workflows/ci.yml"
  ".github/workflows/semantic-pr-title.yml"
  ".github/dependabot.yml"
  ".githooks/commit-msg"
  ".github/scripts/check-pr-changesets.mjs"
  ".github/scripts/check-pr-changesets.test.mjs"
  ".github/scripts/detect-ci-scope.mjs"
  ".github/scripts/detect-ci-scope.test.mjs"
)

run_cmd() {
  local label="$1"
  shift

  echo "[RUN] $label"
  if "$@"; then
    echo "[OK] $label"
    return 0
  fi

  echo "[FAIL] $label" >&2
  return 1
}

for f in "${required_files[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "[FAIL] missing required file: $f" >&2
    exit 1
  fi
done

run_cmd "commit-msg hook syntax" bash -n .githooks/commit-msg
run_cmd "changeset checker syntax" node --check .github/scripts/check-pr-changesets.mjs
run_cmd "changeset checker tests syntax" node --check .github/scripts/check-pr-changesets.test.mjs
run_cmd "CI scope helper syntax" node --check .github/scripts/detect-ci-scope.mjs
run_cmd "CI scope tests syntax" node --check .github/scripts/detect-ci-scope.test.mjs
run_cmd "reporting python script syntax" python3 -m py_compile \
  etl/phase2/reporting/scripts/collect_reporting.py \
  etl/phase2/reporting/scripts/compare_baselines.py \
  etl/phase2/reporting/scripts/contract_lint.py \
  etl/phase2/reporting/scripts/load_stage_contracts.py \
  etl/phase2/reporting/scripts/publish_run.py \
  etl/phase2/reporting/scripts/refresh_baselines.py \
  etl/phase2/reporting/scripts/replay_seed.py

echo "[OK] governance quality gate passed"

if [[ "$run_full" == "true" ]]; then
  if ! run_cmd \
    "dependency preflight (pnpm install --frozen-lockfile --prefer-offline)" \
    pnpm install --frozen-lockfile --prefer-offline; then
    echo "[FAIL] Workspace dependencies not in sync; run pnpm install and retry push." >&2
    exit 1
  fi

  run_cmd "format check" pnpm format:check
  run_cmd "UI package build for lint imports" pnpm exec turbo run build --filter=@fodmap/ui
  run_cmd "lint (CI)" pnpm lint:ci
  run_cmd "python lint (CI)" pnpm python:ci
  run_cmd "changeset checker unit tests" pnpm changeset:ci:test
  run_cmd "changeset full-repository lint" pnpm changeset:ci:lint:all
  run_cmd "changeset coverage check" pnpm changeset:ci:status:strict
  run_cmd "CI scope tests" pnpm ci:scope:test
  run_cmd "openapi check" pnpm --filter @fodmap/types openapi:check
  run_cmd "design token check" pnpm tokens:check
  run_cmd "tailwind style check" pnpm tailwind:styles:check
  run_cmd "UI package build" pnpm ui:build
  run_cmd "UI package style check" pnpm ui:styles:check
  run_cmd "UI package typecheck" pnpm ui:typecheck
  run_cmd "UI package tests" pnpm ui:test
  run_cmd "Storybook typecheck" pnpm exec turbo run typecheck --filter=@fodmap/storybook
  run_cmd "Storybook build" pnpm storybook:build
  run_cmd "Storybook tests" pnpm storybook:test
  run_cmd "App tests" pnpm app:test
  run_cmd "App typecheck" pnpm app:typecheck
  run_cmd "App build" pnpm app:build
  run_cmd "Marketing typecheck" pnpm marketing:typecheck
  run_cmd "Marketing build" pnpm marketing:build
  run_cmd "Research typecheck" pnpm research:typecheck
  run_cmd "Research build" pnpm research:build

  echo "[OK] full quality suite passed"
fi
