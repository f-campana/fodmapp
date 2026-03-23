#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="${ROOT_DIR}/schema/dbmate/migrations"
SCHEMA_FILE="${ROOT_DIR}/schema/dbmate/schema.sql"

usage() {
  cat <<'EOF'
Usage: ./scripts/dbmate.sh <wait|status|migrate|up|new|dump|stamp-replay> [args...]

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

normalize_schema_dump_headers() {
  if [[ ! -f "${SCHEMA_FILE}" ]]; then
    return 0
  fi

  perl -0pi -e '
    s/^-- Dumped from database version ([0-9]+)(?:\.[^\n(]+)?(?: \([^)]+\))?$/-- Dumped from database version $1/mg;
    s/^-- Dumped by pg_dump version ([0-9]+)(?:\.[^\n(]+)?(?: \([^)]+\))?$/-- Dumped by pg_dump version $1/mg;
  ' "${SCHEMA_FILE}"
}

emit_migration_versions() {
  local file=""
  local base=""

  shopt -s nullglob
  local files=("${MIGRATIONS_DIR}"/*.sql)
  shopt -u nullglob

  if [[ "${#files[@]}" -eq 0 ]]; then
    echo "[FAIL] no dbmate migrations found under ${MIGRATIONS_DIR}" >&2
    exit 1
  fi

  for file in "${files[@]}"; do
    base="$(basename "${file}")"
    echo "${base%%_*}"
  done
}

stamp_replay_migration_state() {
  local psql_bin="${PSQL_BIN:-psql}"

  if [[ -z "${API_DB_URL:-}" ]]; then
    echo "[FAIL] API_DB_URL is required for stamp-replay." >&2
    exit 1
  fi

  if ! command -v "${psql_bin}" >/dev/null 2>&1; then
    echo "[FAIL] psql binary not found: ${psql_bin}" >&2
    exit 1
  fi

  {
    cat <<'SQL'
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version character varying NOT NULL PRIMARY KEY
);
SQL
    while IFS= read -r version; do
      printf "INSERT INTO public.schema_migrations (version) VALUES ('%s') ON CONFLICT (version) DO NOTHING;\n" "${version}"
    done < <(emit_migration_versions)
  } | "${psql_bin}" "${API_DB_URL}" -v ON_ERROR_STOP=1
}

run_dbmate_write_command() {
  local status=0

  pnpm exec dbmate -e API_DB_URL -d "${MIGRATIONS_DIR}" -s "${SCHEMA_FILE}" --wait "${command_name}" "$@" || status=$?
  if [[ "${status}" -ne 0 ]]; then
    return "${status}"
  fi

  normalize_schema_dump_headers
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
  status)
    exec pnpm exec dbmate -e API_DB_URL -d "${MIGRATIONS_DIR}" -s "${SCHEMA_FILE}" --wait "${command_name}" "$@"
    ;;
  stamp-replay)
    stamp_replay_migration_state "$@"
    ;;
  migrate|up|dump)
    run_dbmate_write_command "$@"
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
