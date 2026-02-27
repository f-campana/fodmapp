#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

api_db_url="${API_DB_URL:-postgresql://postgres:postgres@localhost:5432/fodmap_api_ci}"
admin_db_url="${ADMIN_DB_URL:-postgresql://postgres:postgres@localhost:5432/postgres}"
replay_db_url="${REPLAY_DB_URL:-$api_db_url}"
replay_db="${REPLAY_DB:-fodmap_api_ci}"
pguser_name="${PGUSER:-postgres}"
pghost_name="${PGHOST:-localhost}"
pgport_name="${PGPORT:-5432}"
psql_bin="${PSQL_BIN:-psql}"
ciqual_cache_dir="${CIQUAL_CACHE_DIR:-${repo_root}/.cache/ciqual-data}"

run_cmd() {
  local label="$1"
  shift

  echo "[RUN] $label"
  "$@"
  echo "[OK] $label"
}

assert_seeded_state() {
  local rollup_count
  local active_count
  local draft_count

  rollup_count="$("$psql_bin" "$api_db_url" -tA -c "SELECT COUNT(*) FROM v_phase3_rollups_latest_full;")"
  if [[ "$rollup_count" != "42" ]]; then
    echo "[FAIL] expected 42 rollups, got: $rollup_count" >&2
    exit 1
  fi

  active_count="$("$psql_bin" "$api_db_url" -tA -c "SELECT COUNT(*) FROM swap_rules r JOIN sources s ON s.source_id = r.source_id WHERE s.source_slug = 'internal_rules_v1' AND r.notes = 'phase3_mvp_rule' AND r.status = 'active';")"
  if [[ "$active_count" != "11" ]]; then
    echo "[FAIL] expected 11 active phase3_mvp_rule rows, got: $active_count" >&2
    exit 1
  fi

  draft_count="$("$psql_bin" "$api_db_url" -tA -c "SELECT COUNT(*) FROM swap_rules r JOIN sources s ON s.source_id = r.source_id WHERE s.source_slug = 'internal_rules_v1' AND r.notes = 'phase3_mvp_rule' AND r.status = 'draft';")"
  if [[ "$draft_count" != "1" ]]; then
    echo "[FAIL] expected 1 draft phase3_mvp_rule row, got: $draft_count" >&2
    exit 1
  fi
}

if ! command -v uv >/dev/null 2>&1; then
  echo "[FAIL] uv is required for ci:api-pr" >&2
  exit 1
fi

if ! command -v "$psql_bin" >/dev/null 2>&1; then
  echo "[FAIL] psql binary not found: $psql_bin" >&2
  exit 1
fi

run_cmd "Install API dependencies (dev+ci)" bash -c "cd api && uv sync --extra dev --extra ci --locked"
run_cmd "Run API contract/unit tests" uv run --project api pytest -m "not integration" api/tests

mkdir -p "$ciqual_cache_dir"
while IFS= read -r line; do
  case "$line" in
    CIQUAL_XLSX=*|CIQUAL_ALIM_XML=*|CIQUAL_GRP_XML=*)
      export "$line"
      ;;
  esac
done < <(./etl/ciqual/fetch_ciqual_data.sh "$ciqual_cache_dir")

run_cmd "Validate replay script syntax" bash -n etl/phase2/scripts/phase2_replay_from_zero.sh
run_cmd "Seed Phase2 via full replay" env \
  REPLAY_DB="$replay_db" \
  ADMIN_DB_URL="$admin_db_url" \
  REPLAY_DB_URL="$replay_db_url" \
  PGUSER="$pguser_name" \
  PGHOST="$pghost_name" \
  PGPORT="$pgport_name" \
  PSQL_BIN="$psql_bin" \
  uv run --project api bash etl/phase2/scripts/phase2_replay_from_zero.sh
run_cmd "Seed Phase3 product layer" env \
  SEED_DB_URL="$api_db_url" \
  PSQL_BIN="$psql_bin" \
  uv run --project api bash etl/phase3/scripts/phase3_seed_for_api_ci.sh
run_cmd "Sanity assert seeded state" assert_seeded_state
run_cmd "Run API integration tests" env API_DB_URL="$api_db_url" uv run --project api pytest -m integration api/tests

echo "[OK] API CI parity suite passed"
