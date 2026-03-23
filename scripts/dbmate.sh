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

replay_schema_has_version() {
  local psql_bin="$1"
  local version="$2"
  local sql=""

  case "${version}" in
    20260321000000)
      sql=$'SELECT CASE\n'
      sql+=$'  WHEN to_regclass(\'public.me_mutation_queue\') IS NOT NULL\n'
      sql+=$'   AND to_regclass(\'public.symptom_logs\') IS NOT NULL\n'
      sql+=$'   AND to_regclass(\'public.me_auth_identities\') IS NOT NULL\n'
      sql+=$'  THEN 1 ELSE 0\n'
      sql+=$'END'
      ;;
    20260321120000)
      sql=$'SELECT CASE\n'
      sql+=$'  WHEN to_regclass(\'public.product_assessments\') IS NOT NULL\n'
      sql+=$'   AND EXISTS (\n'
      sql+=$'     SELECT 1\n'
      sql+=$'     FROM information_schema.columns\n'
      sql+=$'     WHERE table_schema = \'public\'\n'
      sql+=$'       AND table_name = \'products\'\n'
      sql+=$'       AND column_name = \'product_name_en\'\n'
      sql+=$'   )\n'
      sql+=$'   AND EXISTS (\n'
      sql+=$'     SELECT 1\n'
      sql+=$'     FROM information_schema.columns\n'
      sql+=$'     WHERE table_schema = \'public\'\n'
      sql+=$'       AND table_name = \'products\'\n'
      sql+=$'       AND column_name = \'updated_at\'\n'
      sql+=$'   )\n'
      sql+=$'  THEN 1 ELSE 0\n'
      sql+=$'END'
      ;;
    20260321143000)
      sql=$'SELECT CASE\n'
      sql+=$'  WHEN to_regclass(\'public.publish_releases\') IS NOT NULL\n'
      sql+=$'   AND to_regclass(\'public.publish_release_current\') IS NOT NULL\n'
      sql+=$'   AND to_regclass(\'public.published_food_rollups\') IS NOT NULL\n'
      sql+=$'   AND to_regclass(\'public.published_food_subtype_levels\') IS NOT NULL\n'
      sql+=$'   AND to_regclass(\'public.published_swaps\') IS NOT NULL\n'
      sql+=$'  THEN 1 ELSE 0\n'
      sql+=$'END'
      ;;
    *)
      return 1
      ;;
  esac

  local result
  result="$("${psql_bin}" "${API_DB_URL}" -tA -v ON_ERROR_STOP=1 -c "${sql}")"
  [[ "${result}" == "1" ]]
}

emit_bootstrap_mirrored_versions() {
  local psql_bin="$1"
  local file=""
  local base=""
  local version=""

  shopt -s nullglob
  local files=("${MIGRATIONS_DIR}"/*.sql)
  shopt -u nullglob

  if [[ "${#files[@]}" -eq 0 ]]; then
    echo "[FAIL] no dbmate migrations found under ${MIGRATIONS_DIR}" >&2
    exit 1
  fi

  for file in "${files[@]}"; do
    base="$(basename "${file}")"
    version="${base%%_*}"
    if replay_schema_has_version "${psql_bin}" "${version}"; then
      echo "${version}"
    fi
  done
}

stamp_replay_migration_state() {
  local psql_bin="${PSQL_BIN:-psql}"
  local -a mirrored_versions=()
  local version=""

  if [[ -z "${API_DB_URL:-}" ]]; then
    echo "[FAIL] API_DB_URL is required for stamp-replay." >&2
    exit 1
  fi

  if ! command -v "${psql_bin}" >/dev/null 2>&1; then
    echo "[FAIL] psql binary not found: ${psql_bin}" >&2
    exit 1
  fi

  while IFS= read -r version; do
    mirrored_versions+=("${version}")
  done < <(emit_bootstrap_mirrored_versions "${psql_bin}")

  if [[ "${#mirrored_versions[@]}" -eq 0 ]]; then
    echo "[FAIL] no bootstrap-mirrored dbmate migrations were detected in the replay database." >&2
    exit 1
  fi

  {
    cat <<'SQL'
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version character varying NOT NULL PRIMARY KEY
);
SQL
    for version in "${mirrored_versions[@]}"; do
      printf "INSERT INTO public.schema_migrations (version) VALUES ('%s') ON CONFLICT (version) DO NOTHING;\n" "${version}"
    done
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
