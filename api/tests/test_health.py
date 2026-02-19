from __future__ import annotations

from pathlib import Path

import yaml


def test_health_ok(client) -> None:
    response = client.get("/v0/health")
    assert response.status_code == 200

    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["service"]
    assert payload["version"]
    assert payload["timestamp"]


def test_openapi_contract_parity(app_instance) -> None:
    spec_path = Path(__file__).resolve().parent.parent / "openapi" / "v0.yaml"
    spec = yaml.safe_load(spec_path.read_text(encoding="utf-8"))

    expected_paths = {
        "/v0/health",
        "/v0/foods",
        "/v0/foods/{food_slug}",
        "/v0/foods/{food_slug}/rollup",
        "/v0/foods/{food_slug}/subtypes",
        "/v0/foods/{food_slug}/traits",
        "/v0/swaps",
    }

    assert set(spec["paths"].keys()) == expected_paths

    swap_required = set(
        spec["components"]["schemas"]["SwapItem"]["required"]
    )
    assert {
        "from_food_slug",
        "to_food_slug",
        "instruction_fr",
        "instruction_en",
        "from_overall_level",
        "to_overall_level",
        "driver_subtype",
        "from_burden_ratio",
        "to_burden_ratio",
        "coverage_ratio",
        "fodmap_safety_score",
        "overall_score",
        "rule_status",
        "scoring_version",
        "rollup_computed_at",
    }.issubset(swap_required)

    generated = app_instance.openapi()
    assert expected_paths.issubset(set(generated["paths"].keys()))
