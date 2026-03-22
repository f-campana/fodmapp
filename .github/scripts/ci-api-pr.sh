#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

api_db_url="${API_DB_URL:-postgresql://postgres:postgres@localhost:5432/fodmapp_api_ci}"
admin_db_url="${ADMIN_DB_URL:-postgresql://postgres:postgres@localhost:5432/postgres}"
replay_db_url="${REPLAY_DB_URL:-$api_db_url}"
replay_db="${REPLAY_DB:-fodmapp_api_ci}"
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
  local publish_id
  local rollup_count
  local subtype_count
  local active_count
  local active_publishable_swap_count
  local draft_count
  local published_swap_count

  publish_id="$("$psql_bin" "$api_db_url" -tA -c "SELECT publish_id FROM api_publish_meta_current;")"
  if [[ -z "$publish_id" ]]; then
    echo "[FAIL] expected current publish release in api_publish_meta_current" >&2
    exit 1
  fi

  rollup_count="$("$psql_bin" "$api_db_url" -tA -c "SELECT COUNT(*) FROM api_food_rollups_current;")"
  if [[ "$rollup_count" != "42" ]]; then
    echo "[FAIL] expected 42 published rollups, got: $rollup_count" >&2
    exit 1
  fi

  subtype_count="$("$psql_bin" "$api_db_url" -tA -c "SELECT COUNT(*) FROM api_food_subtypes_current;")"
  if [[ "$subtype_count" == "0" ]]; then
    echo "[FAIL] expected published subtype rows, got none" >&2
    exit 1
  fi

  active_count="$("$psql_bin" "$api_db_url" -tA -c "SELECT COUNT(*) FROM swap_rules r JOIN sources s ON s.source_id = r.source_id WHERE s.source_slug = 'internal_rules_v1' AND r.notes = 'phase3_mvp_rule' AND r.status = 'active';")"
  if [[ "$active_count" != "11" ]]; then
    echo "[FAIL] expected 11 active phase3_mvp_rule rows, got: $active_count" >&2
    exit 1
  fi

  active_publishable_swap_count="$("$psql_bin" "$api_db_url" -tA -c "WITH active_rules AS (SELECT r.swap_rule_id, p_from.priority_rank AS from_priority_rank, p_to.priority_rank AS to_priority_rank, vrt.driver_subtype_code AS driver_subtype FROM swap_rules r LEFT JOIN phase2_priority_foods p_from ON p_from.resolved_food_id = r.from_food_id LEFT JOIN phase2_priority_foods p_to ON p_to.resolved_food_id = r.to_food_id LEFT JOIN v_phase3_rollups_latest_full vrt ON vrt.food_id = r.to_food_id WHERE r.status = 'active' AND COALESCE(p_from.priority_rank, 0) <> 2 AND COALESCE(p_to.priority_rank, 0) <> 2), with_burden AS (SELECT ar.swap_rule_id FROM active_rules ar LEFT JOIN v_phase3_rollup_subtype_levels_latest fd ON fd.priority_rank = ar.from_priority_rank AND fd.subtype_code = ar.driver_subtype LEFT JOIN v_phase3_rollup_subtype_levels_latest td ON td.priority_rank = ar.to_priority_rank AND td.subtype_code = ar.driver_subtype) SELECT COUNT(*) FROM with_burden;")"

  draft_count="$("$psql_bin" "$api_db_url" -tA -c "SELECT COUNT(*) FROM swap_rules r JOIN sources s ON s.source_id = r.source_id WHERE s.source_slug = 'internal_rules_v1' AND r.notes = 'phase3_mvp_rule' AND r.status = 'draft';")"
  if [[ "$draft_count" != "1" ]]; then
    echo "[FAIL] expected 1 draft phase3_mvp_rule row, got: $draft_count" >&2
    exit 1
  fi

  published_swap_count="$("$psql_bin" "$api_db_url" -tA -c "SELECT COUNT(*) FROM api_swaps_current;")"
  if [[ "$published_swap_count" != "$active_publishable_swap_count" ]]; then
    echo "[FAIL] expected published swap count to match active publishable swap count ($active_publishable_swap_count), got: $published_swap_count" >&2
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

run_cmd "Install API dependencies (dev+bootstrap)" bash -c "cd api && uv sync --extra dev --extra bootstrap --locked"
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
