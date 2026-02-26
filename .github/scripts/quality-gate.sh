#!/usr/bin/env bash
set -euo pipefail

mode="${1:-standard}"

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
)

run_cmd() {
  local label="$1"
  shift

  echo "[RUN] $label"
  "$@"
  echo "[OK] $label"
}

for f in "${required_files[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "[FAIL] missing required file: $f" >&2
    exit 1
  fi
done

bash -n .githooks/commit-msg

echo "[OK] governance quality gate passed"

if [[ "$mode" == "--full" || "$mode" == "--strict" || "$mode" == "--all" ]]; then
  run_cmd "format check" pnpm format:check
  run_cmd "lint (CI)" pnpm lint:ci
  run_cmd "openapi check" pnpm openapi:check
  run_cmd "design token check" pnpm tokens:check
  run_cmd "tailwind style check" pnpm tailwind:styles:check
  run_cmd "UI package build" pnpm ui:build
  run_cmd "UI package style check" pnpm ui:styles:check
  run_cmd "UI package typecheck" pnpm ui:typecheck
  run_cmd "UI package tests" pnpm ui:test
  run_cmd "Storybook typecheck" pnpm --filter @fodmap/storybook typecheck
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
