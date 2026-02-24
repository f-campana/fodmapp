from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.errors import provider_unavailable
from app.main import create_app


@pytest.fixture()
def barcode_app(monkeypatch, db_url: str):
    monkeypatch.setenv("API_DB_URL", db_url)
    monkeypatch.setenv("BARCODE_FEATURE_ENABLED", "true")
    monkeypatch.setenv("BARCODE_INTERNAL_ENABLED", "true")
    monkeypatch.setenv("BARCODE_ADMIN_TOKEN", "test-secret")
    get_settings.cache_clear()
    app = create_app()
    yield app
    get_settings.cache_clear()


@pytest.fixture()
def barcode_client(barcode_app) -> Iterator[TestClient]:
    with TestClient(barcode_app) as client:
        yield client


def test_barcode_lookup_happy_path(barcode_client: TestClient, barcode_app, monkeypatch) -> None:
    payload = {
        "query_code": "036000291452",
        "normalized_code": "0036000291452",
        "canonical_format": "EAN13",
        "resolution_status": "resolved",
        "cache_status": "fresh",
        "product": {
            "source_code": "0036000291452",
            "product_name_fr": "Produit Test",
            "product_name_en": "Test Product",
            "brand": "Acme",
            "ingredients_text_fr": "riz, eau",
            "categories_tags": ["en:rice"],
            "countries_tags": ["en:france"],
        },
        "resolved_food": {
            "food_slug": "riz_blanche_cuit",
            "canonical_name_fr": "Riz blanc, cuit",
            "canonical_name_en": "White rice, cooked",
            "link_method": "manual",
            "confidence": None,
        },
        "candidates": [],
        "provider": "open_food_facts",
        "provider_last_synced_at": None,
    }
    monkeypatch.setattr(barcode_app.state.barcode_service, "lookup", lambda code: payload)

    response = barcode_client.get("/v0/barcodes/036000291452")
    assert response.status_code == 200
    body = response.json()
    assert body["normalized_code"] == "0036000291452"
    assert body["resolution_status"] == "resolved"
    assert body["resolved_food"]["food_slug"] == "riz_blanche_cuit"


def test_barcode_lookup_invalid_code_returns_422(barcode_client: TestClient) -> None:
    response = barcode_client.get("/v0/barcodes/abc123")
    assert response.status_code == 422
    payload = response.json()
    assert payload["error"]["code"] == "validation_error"


def test_barcode_feature_disabled_returns_404(monkeypatch, db_url: str) -> None:
    monkeypatch.setenv("API_DB_URL", db_url)
    monkeypatch.setenv("BARCODE_FEATURE_ENABLED", "false")
    monkeypatch.setenv("BARCODE_INTERNAL_ENABLED", "false")
    get_settings.cache_clear()
    app = create_app()
    with TestClient(app) as client:
        response = client.get("/v0/barcodes/036000291452")
    get_settings.cache_clear()

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_internal_barcode_missing_auth_returns_401(barcode_client: TestClient) -> None:
    response = barcode_client.put(
        "/v0/internal/barcodes/036000291452/link",
        json={"food_slug": "riz_blanche_cuit"},
        headers={"X-Actor": "tester"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


def test_internal_barcode_invalid_token_returns_401(barcode_client: TestClient) -> None:
    response = barcode_client.put(
        "/v0/internal/barcodes/036000291452/link",
        json={"food_slug": "riz_blanche_cuit"},
        headers={"X-Actor": "tester", "Authorization": "Bearer wrong"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


def test_internal_set_manual_link_success(barcode_client: TestClient, barcode_app, monkeypatch) -> None:
    monkeypatch.setattr(
        barcode_app.state.barcode_service,
        "set_manual_link",
        lambda code, food_slug, actor: {
            "normalized_code": "0036000291452",
            "canonical_format": "EAN13",
            "action": "set_manual",
            "food_slug": food_slug,
        },
    )

    response = barcode_client.put(
        "/v0/internal/barcodes/036000291452/link",
        json={"food_slug": "riz_blanche_cuit"},
        headers={"X-Actor": "tester", "Authorization": "Bearer test-secret"},
    )
    assert response.status_code == 200
    assert response.json()["action"] == "set_manual"


def test_barcode_provider_unavailable_returns_503(barcode_client: TestClient, barcode_app, monkeypatch) -> None:
    monkeypatch.setattr(
        barcode_app.state.barcode_service,
        "lookup",
        lambda code: (_ for _ in ()).throw(provider_unavailable("Barcode provider unavailable")),
    )
    response = barcode_client.get("/v0/barcodes/036000291452")
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "provider_unavailable"


def test_internal_clear_manual_link_success(barcode_client: TestClient, barcode_app, monkeypatch) -> None:
    monkeypatch.setattr(
        barcode_app.state.barcode_service,
        "clear_manual_link",
        lambda code, actor: {
            "normalized_code": "0036000291452",
            "canonical_format": "EAN13",
            "action": "clear_manual",
            "removed": True,
        },
    )

    response = barcode_client.delete(
        "/v0/internal/barcodes/036000291452/link",
        headers={"X-Actor": "tester", "Authorization": "Bearer test-secret"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["action"] == "clear_manual"
    assert payload["removed"] is True
