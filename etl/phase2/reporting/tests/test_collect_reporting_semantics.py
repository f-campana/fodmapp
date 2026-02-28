import importlib.util
import pathlib


def _load_collect_module():
    script_path = pathlib.Path(__file__).resolve().parents[1] / "scripts" / "collect_reporting.py"
    spec = importlib.util.spec_from_file_location("collect_reporting", script_path)
    if spec is None or spec.loader is None:
        raise RuntimeError("failed to load collect_reporting.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_p02_unresolved_equation_violation_fails():
    collect = _load_collect_module()
    metrics = {
        "stages": [
            {
                "stage_id": "fructan_wave01",
                "unresolved_rows": 10,
                "with_candidates_rows": 3,
                "without_candidates_rows": 3,
                "pool_closure_rate": 0.3,
            }
        ],
        "total_with_candidates": 3,
        "total_without_candidates": 3,
    }
    errors = collect._validate_semantics("P-02_candidate_pool_split_by_stage", metrics)
    assert any("must equal unresolved_rows" in e for e in errors)


def test_q03_requires_review_scope_non_empty():
    collect = _load_collect_module()
    metrics = {
        "reviewed_snapshot_rows": 0,
        "snapshot_mismatch_rows": 0,
        "auto_eligible_mismatch_rows": 0,
        "approve_for_ineligible_rows": 0,
    }
    errors = collect._validate_semantics("Q-03_snapshot_lock_drift_panel", metrics)
    assert any("must be >= 1" in e for e in errors)


def test_q04_hard_fails_when_rank2_leak_non_zero():
    collect = _load_collect_module()
    metrics = {
        "phase2_rank2_current_target_measurements": 0,
        "phase3_rules_touching_rank2": 1,
        "api_rank2_leak_rows": 0,
        "overall_pass": True,
    }
    errors = collect._validate_semantics("Q-04_rank2_exclusion_audit", metrics)
    assert any("counters must be zero" in e for e in errors)


def test_e04_requires_frozen_post_batch10_contract():
    collect = _load_collect_module()
    metrics = {
        "mode": "dynamic",
        "source_stage": "post_batch9",
        "rank2_current_target_measurements_expected": 1,
        "cohort_note_count": 0,
        "post_batch10_readiness_rows": 8,
    }
    errors = collect._validate_semantics("E-04_rank2_quarantine_case_study", metrics)
    assert any("frozen_case_study" in e for e in errors)
    assert any("post_batch10" in e for e in errors)
