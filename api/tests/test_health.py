from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path

import pytest
import yaml


def test_health_ok(client) -> None:
    response = client.get("/v0/health")
    assert response.status_code == 200

    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["service"]
    assert payload["version"]
    assert payload["timestamp"]
    assert "publish_id" in payload
    assert "published_at" in payload
    assert "rollup_computed_at_max" in payload


@pytest.mark.integration
def test_health_seeded_publish_metadata_present(client, integration_guard) -> None:
    response = client.get("/v0/health")
    assert response.status_code == 200

    payload = response.json()
    assert payload["publish_id"]
    assert payload["published_at"]
    assert payload["rollup_computed_at_max"]


def test_health_db_unavailable_returns_503(client, app_instance, monkeypatch) -> None:
    @contextmanager
    def _broken_readonly_connection():
        raise RuntimeError("db down")
        yield

    monkeypatch.setattr(app_instance.state.db, "readonly_connection", _broken_readonly_connection)

    response = client.get("/v0/health")
    assert response.status_code == 503
    payload = response.json()
    assert payload["error"]["code"] == "service_unavailable"
    assert payload["error"]["message"] == "Database unavailable"


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
        "/v0/products/barcodes/{code}",
        "/v0/products/{product_id}",
        "/v0/products/{product_id}/ingredients",
        "/v0/products/{product_id}/assessment",
        "/v0/safe-harbors",
        "/v0/swaps",
        "/v0/me/consent",
        "/v0/me/export",
        "/v0/me/export/{export_id}",
        "/v0/me/delete",
        "/v0/me/delete/{delete_request_id}",
        "/v0/me/tracking/feed",
        "/v0/me/tracking/summary/weekly",
        "/v0/me/tracking/symptoms",
        "/v0/me/tracking/symptoms/{symptom_log_id}",
        "/v0/me/tracking/meals",
        "/v0/me/tracking/meals/{meal_log_id}",
        "/v0/me/tracking/custom-foods",
        "/v0/me/tracking/custom-foods/{custom_food_id}",
        "/v0/me/tracking/saved-meals",
        "/v0/me/tracking/saved-meals/{saved_meal_id}",
        "/v0/sync/mutations:batch",
    }

    assert set(spec["paths"].keys()) == expected_paths

    swap_required = set(spec["components"]["schemas"]["SwapItem"]["required"])
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
