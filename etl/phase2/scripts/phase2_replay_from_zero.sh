#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/Users/fabiencampana/Documents/Fodmap"
SCHEMA_FILE="$ROOT_DIR/schema/fodmap_fr_schema.sql"
CIQUAL_ETL="$ROOT_DIR/etl/ciqual/ciqual_etl.py"
PHASE2_SQL_DIR="$ROOT_DIR/etl/phase2/sql"

REPLAY_DB="${REPLAY_DB:-fodmap_replay_test}"
PGHOST_NAME="${PGHOST:-localhost}"
PGPORT_NAME="${PGPORT:-5432}"
PGUSER_NAME="${PGUSER:-${USER:-postgres}}"
ADMIN_DB="${ADMIN_DB:-template1}"
PSQL_BIN="${PSQL_BIN:-}"

ADMIN_DB_URL="${ADMIN_DB_URL:-postgresql://${PGUSER_NAME}@${PGHOST_NAME}:${PGPORT_NAME}/${ADMIN_DB}}"
REPLAY_DB_URL="${REPLAY_DB_URL:-postgresql://${PGUSER_NAME}@${PGHOST_NAME}:${PGPORT_NAME}/${REPLAY_DB}}"

CIQUAL_XLSX="${CIQUAL_XLSX:-/Users/fabiencampana/Downloads/ciqual-data/Table Ciqual 2025_ENG_2025_11_03.xlsx}"
CIQUAL_ALIM_XML="${CIQUAL_ALIM_XML:-/Users/fabiencampana/Downloads/ciqual-data/alim_2025_11_03.xml}"
CIQUAL_GRP_XML="${CIQUAL_GRP_XML:-/Users/fabiencampana/Downloads/ciqual-data/alim_grp_2025_11_03.xml}"

CURRENT_STAGE=""

on_error() {
  printf '\n[FAIL] Replay aborted at stage: %s\n' "${CURRENT_STAGE:-unknown}" >&2
}
trap on_error ERR

run_stage() {
  local label="$1"
  shift
  local start_ts
  local end_ts
  local elapsed

  CURRENT_STAGE="$label"
  start_ts="$(date +%s)"
  printf '\n==> [%s] START\n' "$label"
  "$@"
  end_ts="$(date +%s)"
  elapsed="$((end_ts - start_ts))"
  printf '<== [%s] DONE (%ss)\n' "$label" "$elapsed"
}

require_file() {
  local file_path="$1"
  if [[ ! -f "$file_path" ]]; then
    printf '[FAIL] Required file not found: %s\n' "$file_path" >&2
    exit 1
  fi
}

run_psql_file() {
  local file_path="$1"
  "$PSQL_BIN" "$REPLAY_DB_URL" -v ON_ERROR_STOP=1 -f "$file_path"
}

recreate_db() {
  "$PSQL_BIN" "$ADMIN_DB_URL" -v ON_ERROR_STOP=1 -v replay_db="$REPLAY_DB" <<'SQL'
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = :'replay_db'
  AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS :"replay_db";
CREATE DATABASE :"replay_db";
SQL
}

run_ciqual_load() {
  python3 "$CIQUAL_ETL" load "$CIQUAL_XLSX" \
    --alim-xml "$CIQUAL_ALIM_XML" \
    --alim-grp-xml "$CIQUAL_GRP_XML" \
    --db-url "$REPLAY_DB_URL"
}

resolve_psql_bin() {
  if [[ -n "${PSQL_BIN}" ]]; then
    return
  fi

  if command -v psql >/dev/null 2>&1; then
    PSQL_BIN="$(command -v psql)"
    return
  fi

  for candidate in \
    /opt/homebrew/opt/postgresql@16/bin/psql \
    /opt/homebrew/opt/postgresql@15/bin/psql \
    /opt/homebrew/Cellar/postgresql@16/*/bin/psql \
    /opt/homebrew/Cellar/postgresql@15/*/bin/psql \
    /usr/local/opt/postgresql@16/bin/psql \
    /usr/local/opt/postgresql@15/bin/psql; do
    if [[ -x "${candidate}" ]]; then
      PSQL_BIN="${candidate}"
      return
    fi
  done

  printf '[FAIL] psql not found. Set PSQL_BIN or add psql to PATH.\n' >&2
  exit 1
}

require_file "$SCHEMA_FILE"
require_file "$CIQUAL_ETL"
require_file "$CIQUAL_XLSX"
require_file "$CIQUAL_ALIM_XML"
require_file "$CIQUAL_GRP_XML"
resolve_psql_bin

for sql_file in \
  "$PHASE2_SQL_DIR/phase2_priority_foods_setup.sql" \
  "$PHASE2_SQL_DIR/phase2_scaffold_views.sql" \
  "$PHASE2_SQL_DIR/phase2_resolver_pass2_candidates.sql" \
  "$PHASE2_SQL_DIR/phase2_resolver_pass1.sql" \
  "$PHASE2_SQL_DIR/phase2_batch01_apply.sql" \
  "$PHASE2_SQL_DIR/phase2_batch01_checks.sql" \
  "$PHASE2_SQL_DIR/phase2_ingest_batch10.sql" \
  "$PHASE2_SQL_DIR/phase2_quarantine_rank2_garlic_powder.sql" \
  "$PHASE2_SQL_DIR/phase2_status_sync_batch10.sql" \
  "$PHASE2_SQL_DIR/phase2_post_batch10_checks.sql" \
  "$PHASE2_SQL_DIR/phase2_fructan_wave01_apply.sql" \
  "$PHASE2_SQL_DIR/phase2_fructan_wave01_checks.sql" \
  "$PHASE2_SQL_DIR/phase2_fructan_wave02_apply.sql" \
  "$PHASE2_SQL_DIR/phase2_fructan_wave02_checks.sql" \
  "$PHASE2_SQL_DIR/phase2_gos_wave01_apply.sql" \
  "$PHASE2_SQL_DIR/phase2_gos_wave01_checks.sql" \
  "$PHASE2_SQL_DIR/phase2_gos_wave02_apply.sql" \
  "$PHASE2_SQL_DIR/phase2_gos_wave02_checks.sql" \
  "$PHASE2_SQL_DIR/phase2_polyol_wave01_apply.sql" \
  "$PHASE2_SQL_DIR/phase2_polyol_wave01_checks.sql" \
  "$PHASE2_SQL_DIR/phase2_polyol_wave02_apply.sql" \
  "$PHASE2_SQL_DIR/phase2_polyol_wave02_checks.sql" \
  "$PHASE2_SQL_DIR/phase2_replay_final_checks.sql"
do
  require_file "$sql_file"
done

printf '[INFO] Replay DB URL: %s\n' "$REPLAY_DB_URL"
printf '[INFO] psql binary: %s\n' "$PSQL_BIN"
printf '[INFO] CIQUAL XLSX: %s\n' "$CIQUAL_XLSX"
printf '[INFO] CIQUAL ALIM XML: %s\n' "$CIQUAL_ALIM_XML"
printf '[INFO] CIQUAL ALIM_GRP XML: %s\n' "$CIQUAL_GRP_XML"

run_stage "Drop/create replay database" recreate_db
run_stage "Apply canonical schema" "$PSQL_BIN" "$REPLAY_DB_URL" -v ON_ERROR_STOP=1 -f "$SCHEMA_FILE"
run_stage "CIQUAL ETL load" run_ciqual_load

run_stage "Phase2 setup table seed" run_psql_file "$PHASE2_SQL_DIR/phase2_priority_foods_setup.sql"
run_stage "Phase2 scaffold views" run_psql_file "$PHASE2_SQL_DIR/phase2_scaffold_views.sql"
run_stage "Phase2 resolver pass2 candidates view" run_psql_file "$PHASE2_SQL_DIR/phase2_resolver_pass2_candidates.sql"
run_stage "Phase2 resolver pass1" run_psql_file "$PHASE2_SQL_DIR/phase2_resolver_pass1.sql"
run_stage "Phase2 batch01 apply" run_psql_file "$PHASE2_SQL_DIR/phase2_batch01_apply.sql"
run_stage "Phase2 batch01 checks" run_psql_file "$PHASE2_SQL_DIR/phase2_batch01_checks.sql"
run_stage "Phase2 batch10 ingest" run_psql_file "$PHASE2_SQL_DIR/phase2_ingest_batch10.sql"
run_stage "Phase2 rank2 quarantine" run_psql_file "$PHASE2_SQL_DIR/phase2_quarantine_rank2_garlic_powder.sql"
run_stage "Phase2 batch10 status sync" run_psql_file "$PHASE2_SQL_DIR/phase2_status_sync_batch10.sql"
run_stage "Phase2 post-batch10 checks" run_psql_file "$PHASE2_SQL_DIR/phase2_post_batch10_checks.sql"

run_stage "Wave fructan01 apply" run_psql_file "$PHASE2_SQL_DIR/phase2_fructan_wave01_apply.sql"
run_stage "Wave fructan01 checks" run_psql_file "$PHASE2_SQL_DIR/phase2_fructan_wave01_checks.sql"
run_stage "Wave fructan02 apply" run_psql_file "$PHASE2_SQL_DIR/phase2_fructan_wave02_apply.sql"
run_stage "Wave fructan02 checks" run_psql_file "$PHASE2_SQL_DIR/phase2_fructan_wave02_checks.sql"
run_stage "Wave gos01 apply" run_psql_file "$PHASE2_SQL_DIR/phase2_gos_wave01_apply.sql"
run_stage "Wave gos01 checks" run_psql_file "$PHASE2_SQL_DIR/phase2_gos_wave01_checks.sql"
run_stage "Wave gos02 apply" run_psql_file "$PHASE2_SQL_DIR/phase2_gos_wave02_apply.sql"
run_stage "Wave gos02 checks" run_psql_file "$PHASE2_SQL_DIR/phase2_gos_wave02_checks.sql"
run_stage "Wave polyol01 apply" run_psql_file "$PHASE2_SQL_DIR/phase2_polyol_wave01_apply.sql"
run_stage "Wave polyol01 checks" run_psql_file "$PHASE2_SQL_DIR/phase2_polyol_wave01_checks.sql"
run_stage "Wave polyol02 apply" run_psql_file "$PHASE2_SQL_DIR/phase2_polyol_wave02_apply.sql"
run_stage "Wave polyol02 checks" run_psql_file "$PHASE2_SQL_DIR/phase2_polyol_wave02_checks.sql"

run_stage "Phase2 replay final checks" run_psql_file "$PHASE2_SQL_DIR/phase2_replay_final_checks.sql"

printf '\n[PASS] Phase2 replay completed successfully for database "%s"\n' "$REPLAY_DB"
