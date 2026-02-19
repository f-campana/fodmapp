#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)}"
PHASE3_SQL_DIR="${ROOT_DIR}/etl/phase3/sql"
REVIEW_CSV="${ROOT_DIR}/etl/phase3/decisions/phase3_swap_activation_review_v1.csv"

SEED_DB_URL="${SEED_DB_URL:-${1:-}}"
PSQL_BIN="${PSQL_BIN:-psql}"

if [[ -z "${SEED_DB_URL}" ]]; then
  echo "[FAIL] SEED_DB_URL is required (or pass DB URL as first arg)." >&2
  exit 1
fi

cd "${ROOT_DIR}"

require_file() {
  local file_path="$1"
  if [[ ! -f "${file_path}" ]]; then
    echo "[FAIL] Required file not found: ${file_path}" >&2
    exit 1
  fi
}

run_sql() {
  local file_path="$1"
  echo "[INFO] Running $(basename "${file_path}")"
  "${PSQL_BIN}" "${SEED_DB_URL}" -v ON_ERROR_STOP=1 -f "${file_path}"
}

require_file "${REVIEW_CSV}"
require_file "${PHASE3_SQL_DIR}/phase3_traits_apply.sql"
require_file "${PHASE3_SQL_DIR}/phase3_rollups_compute.sql"
require_file "${PHASE3_SQL_DIR}/phase3_rollups_6subtype_checks.sql"
require_file "${PHASE3_SQL_DIR}/phase3_swap_rules_apply.sql"
require_file "${PHASE3_SQL_DIR}/phase3_swap_rules_rescore.sql"
require_file "${PHASE3_SQL_DIR}/phase3_swap_activation_apply.sql"
require_file "${PHASE3_SQL_DIR}/phase3_swap_activation_checks.sql"
require_file "${PHASE3_SQL_DIR}/phase3_mvp_checks.sql"

python3 - "${REVIEW_CSV}" <<'PY'
import csv
import sys
from pathlib import Path

p = Path(sys.argv[1])
rows = list(csv.DictReader(p.open()))
approve = sum(1 for r in rows if r.get("review_decision") == "approve")
reject = sum(1 for r in rows if r.get("review_decision") == "reject")

if len(rows) != 12:
    raise SystemExit(f"[FAIL] phase3 review CSV row count must be 12, got {len(rows)}")
if approve != 11 or reject != 1:
    raise SystemExit(
        f"[FAIL] phase3 review CSV must be 11 approve / 1 reject, got {approve} / {reject}"
    )
print("[INFO] phase3 review CSV split verified: 11 approve / 1 reject")
PY

run_sql "${PHASE3_SQL_DIR}/phase3_traits_apply.sql"
run_sql "${PHASE3_SQL_DIR}/phase3_rollups_compute.sql"
run_sql "${PHASE3_SQL_DIR}/phase3_rollups_6subtype_checks.sql"
run_sql "${PHASE3_SQL_DIR}/phase3_swap_rules_apply.sql"
run_sql "${PHASE3_SQL_DIR}/phase3_swap_rules_rescore.sql"

# Gate A exports a review packet with blank reviewer fields. In CI we need the
# committed reviewed packet for Gate B, and snapshot lock will enforce freshness.
git checkout HEAD -- "${REVIEW_CSV}"

python3 - "${REVIEW_CSV}" <<'PY'
import csv
import sys
from pathlib import Path

p = Path(sys.argv[1])
rows = list(csv.DictReader(p.open()))
approve = sum(1 for r in rows if r.get("review_decision") == "approve")
reject = sum(1 for r in rows if r.get("review_decision") == "reject")
missing_meta = sum(
    1 for r in rows if not (r.get("reviewed_by") or "").strip() or not (r.get("reviewed_at") or "").strip()
)

if len(rows) != 12:
    raise SystemExit(f"[FAIL] phase3 review CSV row count must be 12, got {len(rows)}")
if approve != 11 or reject != 1:
    raise SystemExit(
        f"[FAIL] phase3 review CSV must be 11 approve / 1 reject, got {approve} / {reject}"
    )
if missing_meta != 0:
    raise SystemExit(f"[FAIL] phase3 review CSV has {missing_meta} rows missing reviewed_by/reviewed_at")
print("[INFO] phase3 reviewed CSV restored from git and validated")
PY

run_sql "${PHASE3_SQL_DIR}/phase3_swap_activation_apply.sql"
run_sql "${PHASE3_SQL_DIR}/phase3_swap_activation_checks.sql"
run_sql "${PHASE3_SQL_DIR}/phase3_mvp_checks.sql"

echo "[PASS] Phase3 CI seed completed successfully"
