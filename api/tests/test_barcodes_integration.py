from __future__ import annotations

from datetime import datetime, timedelta, timezone

import psycopg
import pytest
from psycopg.rows import dict_row

from app.config import Settings
from app.db import Database
from app.providers.open_food_facts import OpenFoodFactsFetchResult
from app.services.barcode_service import BarcodeService


pytestmark = pytest.mark.integration


class _FakeProvider:
    def __init__(self, result: OpenFoodFactsFetchResult) -> None:
        self._result = result

    def fetch_product(self, _normalized_code: str) -> OpenFoodFactsFetchResult:
        return self._result


def _settings(db_url: str) -> Settings:
    return Settings(
        api_db_url=db_url,
        api_name="fodmap-api",
        api_version="v0",
        barcode_feature_enabled=True,
        barcode_internal_enabled=True,
        barcode_admin_token="test-secret",
        off_api_base_url="https://world.openfoodfacts.org",
        off_user_agent="FODMAPPlatform/0.1 (contact@example.com)",
        off_timeout_seconds=3.0,
        barcode_cache_ttl_hours=168,
        barcode_heuristic_threshold=0.75,
        barcode_heuristic_margin=0.10,
    )


def _tables_ready(db_conn) -> bool:
    row = db_conn.execute(
        """
        SELECT
          to_regclass('public.barcode_cache_entries') AS cache_table,
          to_regclass('public.barcode_food_links') AS links_table,
          to_regclass('public.barcode_food_link_events') AS events_table
        """
    ).fetchone()
    return bool(row and row["cache_table"] and row["links_table"] and row["events_table"])


def test_barcode_link_guardrails(db_url: str, db_conn, integration_guard) -> None:
    if not _tables_ready(db_conn):
        pytest.skip("barcode schema tables are not present")

    with psycopg.connect(db_url, row_factory=dict_row) as conn:
        food_row = conn.execute(
            "SELECT food_id FROM foods WHERE status = 'active' ORDER BY food_slug LIMIT 1"
        ).fetchone()
        assert food_row is not None

        with pytest.raises(psycopg.errors.CheckViolation):
            with conn.transaction():
                conn.execute(
                    """
                    INSERT INTO barcode_food_links (
                      normalized_code,
                      food_id,
                      link_method,
                      confidence,
                      heuristic_version,
                      signals_json,
                      created_by,
                      updated_by
                    ) VALUES (
                      '4006381333931',
                      %(food_id)s,
                      'heuristic',
                      NULL,
                      'v1',
                      '{}'::jsonb,
                      'test',
                      'test'
                    )
                    """,
                    {"food_id": food_row["food_id"]},
                )

        with pytest.raises(psycopg.errors.CheckViolation):
            with conn.transaction():
                conn.execute(
                    """
                    INSERT INTO barcode_food_links (
                      normalized_code,
                      food_id,
                      link_method,
                      confidence,
                      heuristic_version,
                      signals_json,
                      created_by,
                      updated_by
                    ) VALUES (
                      '0036000291452',
                      %(food_id)s,
                      'manual',
                      0.900,
                      NULL,
                      NULL,
                      'test',
                      'test'
                    )
                    """,
                    {"food_id": food_row["food_id"]},
                )


def test_manual_link_overrides_heuristic(db_url: str, db_conn, integration_guard) -> None:
    if not _tables_ready(db_conn):
        pytest.skip("barcode schema tables are not present")

    with psycopg.connect(db_url, row_factory=dict_row) as conn:
        foods = conn.execute(
            """
            SELECT food_id, food_slug, COALESCE(canonical_name_fr, food_slug) AS canonical_name_fr
            FROM foods
            WHERE status = 'active'
            ORDER BY food_slug
            LIMIT 2
            """
        ).fetchall()
        if len(foods) < 2:
            pytest.skip("insufficient foods in fixture DB")
        manual_food = foods[0]

        conn.execute("DELETE FROM barcode_food_link_events WHERE normalized_code = '4006381333931'")
        conn.execute("DELETE FROM barcode_food_links WHERE normalized_code = '4006381333931'")
        conn.execute("DELETE FROM barcode_cache_entries WHERE normalized_code = '4006381333931'")
        conn.commit()

        conn.execute(
            """
            INSERT INTO barcode_food_links (
              normalized_code,
              food_id,
              link_method,
              confidence,
              heuristic_version,
              signals_json,
              created_by,
              updated_by
            ) VALUES (
              '4006381333931',
              %(food_id)s,
              'manual',
              NULL,
              NULL,
              NULL,
              'integration_test',
              'integration_test'
            )
            """,
            {"food_id": manual_food["food_id"]},
        )
        conn.commit()

    provider_result = OpenFoodFactsFetchResult(
        provider_status="found",
        fetched_at=datetime.now(timezone.utc),
        payload={"status": 1, "product": {"code": "4006381333931"}},
        source_code="4006381333931",
        product_name_fr="Produit de test",
        product_name_en="Test product",
        brand="BrandX",
        ingredients_text_fr="eau, sel",
        categories_tags=["en:test"],
        countries_tags=["en:france"],
        last_error_code=None,
    )
    db = Database(db_url)
    db.open()
    try:
        service = BarcodeService(db, _settings(db_url), _FakeProvider(provider_result))
        payload = service.lookup("4006381333931")
    finally:
        db.close()

    assert payload["resolution_status"] == "resolved"
    assert payload["resolved_food"]["link_method"] == "manual"
    assert payload["resolved_food"]["food_slug"] == manual_food["food_slug"]

    with psycopg.connect(db_url, row_factory=dict_row) as conn:
        conn.execute("DELETE FROM barcode_food_link_events WHERE normalized_code = '4006381333931'")
        conn.execute("DELETE FROM barcode_food_links WHERE normalized_code = '4006381333931'")
        conn.execute("DELETE FROM barcode_cache_entries WHERE normalized_code = '4006381333931'")
        conn.commit()


def test_stale_cache_fallback_when_provider_fails(db_url: str, db_conn, integration_guard) -> None:
    if not _tables_ready(db_conn):
        pytest.skip("barcode schema tables are not present")

    stale_fetched_at = datetime.now(timezone.utc) - timedelta(days=10)
    stale_expires_at = datetime.now(timezone.utc) - timedelta(days=3)
    with psycopg.connect(db_url, row_factory=dict_row) as conn:
        conn.execute("DELETE FROM barcode_food_link_events WHERE normalized_code = '0036000291452'")
        conn.execute("DELETE FROM barcode_food_links WHERE normalized_code = '0036000291452'")
        conn.execute("DELETE FROM barcode_cache_entries WHERE normalized_code = '0036000291452'")
        conn.execute(
            """
            INSERT INTO barcode_cache_entries (
              normalized_code,
              canonical_format,
              provider_slug,
              provider_status,
              provider_payload,
              source_code,
              product_name_fr,
              product_name_en,
              brand,
              ingredients_text_fr,
              categories_tags,
              countries_tags,
              fetched_at,
              expires_at,
              last_error_code,
              last_error_at
            ) VALUES (
              '0036000291452',
              'EAN13',
              'open_food_facts',
              'found',
              '{"status": 1}'::jsonb,
              '0036000291452',
              'Cache produit',
              'Cached product',
              'CacheBrand',
              'eau',
              ARRAY['en:test'],
              ARRAY['en:france'],
              %(fetched_at)s,
              %(expires_at)s,
              NULL,
              NULL
            )
            """,
            {"fetched_at": stale_fetched_at, "expires_at": stale_expires_at},
        )
        conn.commit()

    provider_result = OpenFoodFactsFetchResult(
        provider_status="error",
        fetched_at=datetime.now(timezone.utc),
        payload=None,
        source_code=None,
        product_name_fr=None,
        product_name_en=None,
        brand=None,
        ingredients_text_fr=None,
        categories_tags=[],
        countries_tags=[],
        last_error_code="network_error",
    )

    db = Database(db_url)
    db.open()
    try:
        service = BarcodeService(db, _settings(db_url), _FakeProvider(provider_result))
        payload = service.lookup("036000291452")
    finally:
        db.close()

    assert payload["cache_status"] == "stale"
    assert payload["product"] is not None
    assert payload["provider_last_synced_at"] is not None

    with psycopg.connect(db_url, row_factory=dict_row) as conn:
        conn.execute("DELETE FROM barcode_food_link_events WHERE normalized_code = '0036000291452'")
        conn.execute("DELETE FROM barcode_food_links WHERE normalized_code = '0036000291452'")
        conn.execute("DELETE FROM barcode_cache_entries WHERE normalized_code = '0036000291452'")
        conn.commit()
