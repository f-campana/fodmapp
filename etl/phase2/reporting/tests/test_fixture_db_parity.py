import json
import math
import os
import pathlib
import subprocess
from typing import Any, Dict


REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
FIXTURE_DIR = (
    REPO_ROOT / "etl/phase2/reporting/tests/fixtures/now-set/query-results"
)
BASELINE_PATH = (
    REPO_ROOT
    / "etl/phase2/reporting/contracts/baselines/now/p01_p02_p03_q02_q03_q04_e03_e04.v1.json"
)
SQL_DIR = REPO_ROOT / "etl/phase2/reporting/sql"

FIGURE_SQL_FILE = {
    "P-01_stage_progression_contract_curve": "p01_stage_progression.sql",
    "P-02_candidate_pool_split_by_stage": "p02_candidate_pool_split.sql",
    "P-03_gap_completion_matrix": "p03_gap_completion_matrix.sql",
    "Q-02_critical_contract_scorecard": "q02_critical_contract_scorecard.sql",
    "Q-03_snapshot_lock_drift_panel": "q03_snapshot_lock_drift.sql",
    "Q-04_rank2_exclusion_audit": "q04_rank2_exclusion_audit.sql",
    "E-03_threshold_provenance_completeness": "e03_threshold_provenance.sql",
    "E-04_rank2_quarantine_case_study": "e04_frozen_case_study.sql",
}


def _load_json(path: pathlib.Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        payload = json.load(f)
    assert isinstance(payload, dict)
    return payload


def _normalize(value: Any, eps: float = 1e-6) -> Any:
    if isinstance(value, dict):
        normalized = {}
        for key in sorted(value.keys()):
            if key == "_contract_refs":
                continue
            normalized[key] = _normalize(value[key], eps)
        return normalized
    if isinstance(value, list):
        return [_normalize(v, eps) for v in value]
    if isinstance(value, float):
        if math.isfinite(value):
            return round(value / eps) * eps
    return value


def test_fixture_semantics_match_committed_now_baseline():
    baseline = _load_json(BASELINE_PATH)
    baseline_by_id = {f["figure_id"]: f for f in baseline["figures"]}

    for fixture_path in sorted(FIXTURE_DIR.glob("*.json")):
        fixture = _load_json(fixture_path)
        figure_id = fixture["figure_id"]
        assert figure_id in baseline_by_id
        expected_metrics = baseline_by_id[figure_id]["metrics"]
        fixture_metrics = fixture["source_rows"]
        assert _normalize(fixture_metrics) == _normalize(expected_metrics)


def test_optional_db_parity_matches_fixture_contracts():
    db_url = os.getenv("REPORTING_PARITY_DB_URL", "").strip()
    if not db_url:
        return

    fixtures = {
        _load_json(path)["figure_id"]: _load_json(path)["source_rows"]
        for path in sorted(FIXTURE_DIR.glob("*.json"))
    }

    for figure_id, sql_file in FIGURE_SQL_FILE.items():
        sql_path = SQL_DIR / sql_file
        cmd = ["psql", db_url, "-v", "ON_ERROR_STOP=1", "-q", "-t", "-A", "-f", str(sql_path)]
        proc = subprocess.run(cmd, cwd=str(REPO_ROOT), text=True, capture_output=True)
        assert proc.returncode == 0, proc.stderr
        lines = [line.strip() for line in proc.stdout.splitlines() if line.strip()]
        assert lines, f"no JSON returned for {figure_id}"
        payload = json.loads(lines[-1])
        payload.pop("_contract_refs", None)
        assert _normalize(payload) == _normalize(fixtures[figure_id])
