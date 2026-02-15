#!/usr/bin/env bash
set -euo pipefail

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

for f in "${required_files[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "[FAIL] missing required file: $f" >&2
    exit 1
  fi
done

bash -n .githooks/commit-msg

echo "[OK] governance quality gate passed"
