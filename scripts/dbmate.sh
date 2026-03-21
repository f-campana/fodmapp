#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="${ROOT_DIR}/schema/dbmate/migrations"
SCHEMA_FILE="${ROOT_DIR}/schema/dbmate/schema.sql"

usage() {
  cat <<'EOF'
Usage: ./scripts/dbmate.sh <wait|status|migrate|up|new|dump> [args...]

Repo contract:
- long-lived environments use dbmate
- disposable replay databases still use schema/fodmap_fr_schema.sql
- migration files must be timestamp-prefixed and strictly ordered
EOF
}

check_ordered_migrations() {
  local prev_ts=""
  local file=""
  local base=""
  local ts=""

  shopt -s nullglob
  local files=("${MIGRATIONS_DIR}"/*.sql)
  shopt -u nullglob

  for file in "${files[@]}"; do
    base="$(basename "${file}")"
    if [[ ! "${base}" =~ ^[0-9]{14}_[a-z0-9_-]+\.sql$ ]]; then
      echo "[FAIL] dbmate migration filenames must match YYYYMMDDHHMMSS_slug.sql: ${base}" >&2
      exit 1
    fi

    ts="${base%%_*}"
    if [[ -n "${prev_ts}" && ( "${ts}" == "${prev_ts}" || "${ts}" < "${prev_ts}" ) ]]; then
      echo "[FAIL] dbmate migrations must stay strictly timestamp-ordered: ${base}" >&2
      exit 1
    fi

    prev_ts="${ts}"
  done
}

command_name="${1:-}"
if [[ -z "${command_name}" ]]; then
  usage >&2
  exit 2
fi
shift || true

check_ordered_migrations

case "${command_name}" in
  wait)
    exec pnpm exec dbmate -e API_DB_URL -d "${MIGRATIONS_DIR}" -s "${SCHEMA_FILE}" wait "$@"
    ;;
  status|migrate|up|dump)
    exec pnpm exec dbmate -e API_DB_URL -d "${MIGRATIONS_DIR}" -s "${SCHEMA_FILE}" --wait "${command_name}" "$@"
    ;;
  new|n)
    if [[ "$#" -eq 0 ]]; then
      echo "[FAIL] dbmate new requires a migration name." >&2
      usage >&2
      exit 2
    fi
    exec pnpm exec dbmate -d "${MIGRATIONS_DIR}" -s "${SCHEMA_FILE}" new "$@"
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    echo "[FAIL] unsupported dbmate command: ${command_name}" >&2
    usage >&2
    exit 2
    ;;
esac
