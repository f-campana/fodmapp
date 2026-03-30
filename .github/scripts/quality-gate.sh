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

# Avoid py_compile permission errors in sandboxed environments that cannot write
# to the default user cache directory.
if [[ -z "${PYTHONPYCACHEPREFIX:-}" ]]; then
  export PYTHONPYCACHEPREFIX="${TMPDIR:-/tmp}/pycache"
fi

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
  ".github/scripts/ci-scope-rules.mjs"
  ".github/scripts/detect-changeset-pr-scope.mjs"
  ".github/scripts/detect-changeset-pr-scope.test.mjs"
  ".github/scripts/detect-ci-scope.mjs"
  ".github/scripts/detect-ci-scope.test.mjs"
  ".github/scripts/docs-hygiene-audit.mjs"
  ".github/scripts/docs-hygiene-audit.test.mjs"
  "scripts/dbmate.sh"
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

run_cmd_parallel() {
  if [[ "$#" -eq 0 ]]; then
    return 0
  fi

  local temp_dir
  temp_dir="$(mktemp -d)"

  local -a pids=()
  local -a labels=()
  local -a status_files=()
  local -a log_files=()
  local task
  local index=0

  for task in "$@"; do
    local label="${task%%::*}"
    local command="${task#*::}"

    if [[ "$label" == "$command" ]]; then
      echo "[FAIL] malformed parallel task: $task" >&2
      rm -rf "$temp_dir"
      return 1
    fi

    local log_file="${temp_dir}/task-${index}.log"
    local status_file="${temp_dir}/task-${index}.status"

    labels[index]="$label"
    log_files[index]="$log_file"
    status_files[index]="$status_file"

    echo "[RUN] $label"
    (
      bash -lc "$command"
      local command_status=$?
      echo "$command_status" > "$status_file"
    ) >"$log_file" 2>&1 &
    pids[index]=$!
    ((index += 1))
  done

  local fail=0
  local i
  for ((i = 0; i < index; i += 1)); do
    if ! wait "${pids[i]}"; then
      :
    fi

    local status=1
    if [[ -f "${status_files[i]}" ]]; then
      read -r status < "${status_files[i]}"
    fi

    if [[ "$status" == "0" ]]; then
      echo "[OK] ${labels[i]}"
    else
      echo "[FAIL] ${labels[i]}" >&2
      if [[ -f "${log_files[i]}" ]]; then
        cat "${log_files[i]}" >&2
      fi
      fail=1
    fi
  done

  rm -rf "$temp_dir"
  return "$fail"
}

run_reporting_fixture_smoke() {
  local temp_dir
  local status=0

  temp_dir="$(mktemp -d)"
  python3 etl/phase2/reporting/scripts/collect_reporting.py \
    --mode smoke \
    --figures now \
    --source fixture \
    --fixture-dir etl/phase2/reporting/tests/fixtures/now-set/query-results \
    --out-dir "$temp_dir" \
    --trigger pr_smoke || status=$?
  rm -rf "$temp_dir"
  return "$status"
}

resolve_quality_gate_scope() {
  local scope_output
  scope_output="$(mktemp)"

  GITHUB_EVENT_NAME="${GITHUB_EVENT_NAME:-push}" \
  BASE_SHA="${BASE_SHA:-}" \
  HEAD_SHA="${HEAD_SHA:-}" \
  GITHUB_OUTPUT="$scope_output" \
  node .github/scripts/detect-ci-scope.mjs

  quality_scope_design_tokens="${quality_scope_design_tokens:-true}"
  quality_scope_ui_foundation="${quality_scope_ui_foundation:-true}"
  quality_scope_app_scaffold="${quality_scope_app_scaffold:-true}"
  quality_scope_content_scaffolds="${quality_scope_content_scaffolds:-true}"

  while IFS="=" read -r key value; do
    case "$key" in
      design_tokens)
        quality_scope_design_tokens="$value"
        ;;
      ui_foundation)
        quality_scope_ui_foundation="$value"
        ;;
      app_scaffold)
        quality_scope_app_scaffold="$value"
        ;;
      content_scaffolds)
        quality_scope_content_scaffolds="$value"
        ;;
    esac
  done <"$scope_output"

  rm -f "$scope_output"

  echo "[INFO] Full scope: design_tokens=${quality_scope_design_tokens} ui_foundation=${quality_scope_ui_foundation} app_scaffold=${quality_scope_app_scaffold} content_scaffolds=${quality_scope_content_scaffolds}"
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
run_cmd "changeset scope rules syntax" node --check .github/scripts/ci-scope-rules.mjs
run_cmd "changeset scope detector syntax" node --check .github/scripts/detect-changeset-pr-scope.mjs
run_cmd "changeset scope detector tests syntax" node --check .github/scripts/detect-changeset-pr-scope.test.mjs
run_cmd "CI scope helper syntax" node --check .github/scripts/detect-ci-scope.mjs
run_cmd "CI scope tests syntax" node --check .github/scripts/detect-ci-scope.test.mjs
run_cmd "docs hygiene audit syntax" node --check .github/scripts/docs-hygiene-audit.mjs
run_cmd "docs hygiene audit tests syntax" node --check .github/scripts/docs-hygiene-audit.test.mjs
run_cmd "app dev helper syntax" node --check apps/app/scripts/app-dev.mjs
run_cmd "dbmate wrapper syntax" bash -n scripts/dbmate.sh
run_cmd "API operator python script syntax" python3 -m py_compile \
  api/scripts/repair_consent_event_chain.py \
  api/scripts/phase3_bootstrap.py \
  api/scripts/phase3_promote.py
run_cmd "API review packet helper syntax" python3 -m py_compile \
  api/scripts/phase3_review_packet_overlay.py
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

  quality_scope_design_tokens="true"
  quality_scope_ui_foundation="true"
  quality_scope_app_scaffold="true"
  quality_scope_content_scaffolds="true"
  resolve_quality_gate_scope

  run_cmd "reporting fixture smoke" run_reporting_fixture_smoke

  full_gate_tasks=(
    "format check::pnpm format:check"
    "python lint (CI)::pnpm python:ci"
    "changeset checker unit tests::pnpm changeset:ci:test"
    "changeset full-repository lint::pnpm changeset:ci:lint:all"
    "changeset coverage check::pnpm changeset:ci:status:strict"
    "CI scope tests::pnpm ci:scope:test"
    "changeset scope detector tests::node --test .github/scripts/detect-changeset-pr-scope.test.mjs"
    "docs hygiene audit unit tests::node --test .github/scripts/docs-hygiene-audit.test.mjs"
    "openapi check::pnpm --filter @fodmapp/types openapi:check"
    "design token check::pnpm tokens:check"
    "tailwind style check::pnpm tailwind:styles:check"
  )

  if ! run_cmd_parallel "${full_gate_tasks[@]}"; then
    exit 1
  fi

  # Dist-backed lint and build lanes share workspace outputs such as packages/ui/dist,
  # so they must stay serialized even when the read-only checks above run in parallel.
  run_cmd \
    "lint (JS dist-backed)" \
    bash -lc "pnpm exec turbo run build --filter=@fodmapp/domain --filter=@fodmapp/ui --filter=@fodmapp/reporting && pnpm lint:js:ci"

  if [[ "$quality_scope_ui_foundation" == "true" ]]; then
    run_cmd \
      "ui scope (foundation)" \
      bash -lc "pnpm exec turbo run build --filter=@fodmapp/ui --filter=@fodmapp/reporting && pnpm exec turbo run build typecheck test --filter=@fodmapp/ui && pnpm ui:styles:check && pnpm exec turbo run typecheck storybook:build storybook:test --filter=@fodmapp/storybook"
  fi

  if [[ "$quality_scope_app_scaffold" == "true" ]]; then
    run_cmd "app scope (test)" pnpm exec turbo run test --filter=@fodmapp/app
    run_cmd "app scope (typecheck)" pnpm exec turbo run typecheck --filter=@fodmapp/app
    run_cmd "app scope (build)" pnpm exec turbo run build --filter=@fodmapp/app
  fi

  if [[ "$quality_scope_content_scaffolds" == "true" ]]; then
    run_cmd \
      "content scope" \
      bash -lc "pnpm exec turbo run build --filter=@fodmapp/marketing --filter=@fodmapp/research && pnpm exec turbo run typecheck --filter=@fodmapp/marketing --filter=@fodmapp/research"
  fi

  echo "[OK] full quality suite passed"
fi
