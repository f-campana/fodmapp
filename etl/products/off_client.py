from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from urllib import error, parse, request


@dataclass(frozen=True)
class OpenFoodFactsSettings:
    base_url: str
    user_agent: str
    timeout_seconds: float


@dataclass(frozen=True)
class OpenFoodFactsFetchResult:
    provider_status: str
    fetched_at: datetime
    payload: dict[str, Any] | None
    source_code: str | None
    product_name_fr: str | None
    product_name_en: str | None
    brand: str | None
    ingredients_text_fr: str | None
    categories_tags: list[str]
    countries_tags: list[str]
    last_error_code: str | None


class OpenFoodFactsClient:
    def __init__(self, settings: OpenFoodFactsSettings) -> None:
        self._base_url = settings.base_url.rstrip("/")
        self._user_agent = settings.user_agent
        self._timeout = settings.timeout_seconds

    def fetch_product(self, normalized_code: str) -> OpenFoodFactsFetchResult:
        fetched_at = datetime.now(timezone.utc)
        fields = ",".join(
            [
                "code",
                "product_name",
                "product_name_fr",
                "product_name_en",
                "generic_name",
                "generic_name_fr",
                "generic_name_en",
                "brands",
                "brands_tags",
                "ingredients_text",
                "ingredients_text_fr",
                "categories_tags",
                "countries_tags",
            ]
        )
        url = f"{self._base_url}/api/v2/product/{parse.quote(normalized_code)}?{parse.urlencode({'fields': fields})}"
        req = request.Request(
            url,
            headers={"User-Agent": self._user_agent, "Accept": "application/json"},
            method="GET",
        )

        try:
            with request.urlopen(req, timeout=self._timeout) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
        except error.HTTPError as exc:
            return _error_result(fetched_at, f"http_{exc.code}")
        except error.URLError:
            return _error_result(fetched_at, "network_error")
        except (UnicodeDecodeError, json.JSONDecodeError):
            return _error_result(fetched_at, "invalid_payload")

        product = payload.get("product") if isinstance(payload, dict) else None
        status = payload.get("status") if isinstance(payload, dict) else 0
        if status != 1 or not isinstance(product, dict):
            return OpenFoodFactsFetchResult(
                provider_status="not_found",
                fetched_at=fetched_at,
                payload=payload if isinstance(payload, dict) else None,
                source_code=normalized_code,
                product_name_fr=None,
                product_name_en=None,
                brand=None,
                ingredients_text_fr=None,
                categories_tags=[],
                countries_tags=[],
                last_error_code=None,
            )

        product_name_fr = (
            product.get("product_name_fr")
            or product.get("generic_name_fr")
            or product.get("product_name")
            or product.get("generic_name")
        )
        product_name_en = (
            product.get("product_name_en")
            or product.get("generic_name_en")
            or product.get("product_name")
            or product_name_fr
        )

        return OpenFoodFactsFetchResult(
            provider_status="found",
            fetched_at=fetched_at,
            payload=payload,
            source_code=str(product.get("code") or normalized_code),
            product_name_fr=product_name_fr,
            product_name_en=product_name_en,
            brand=_pick_brand(product.get("brands"), product.get("brands_tags")),
            ingredients_text_fr=product.get("ingredients_text_fr") or product.get("ingredients_text"),
            categories_tags=_as_string_list(product.get("categories_tags")),
            countries_tags=_as_string_list(product.get("countries_tags")),
            last_error_code=None,
        )


def settings_from_env() -> OpenFoodFactsSettings:
    return OpenFoodFactsSettings(
        base_url=os.getenv("OFF_API_BASE_URL", "https://world.openfoodfacts.org"),
        user_agent=os.getenv("OFF_USER_AGENT", "FODMAPP/0.1 (contact@fodmapp.local)"),
        timeout_seconds=float(os.getenv("OFF_TIMEOUT_SECONDS", "3")),
    )


def _error_result(fetched_at: datetime, error_code: str) -> OpenFoodFactsFetchResult:
    return OpenFoodFactsFetchResult(
        provider_status="error",
        fetched_at=fetched_at,
        payload=None,
        source_code=None,
        product_name_fr=None,
        product_name_en=None,
        brand=None,
        ingredients_text_fr=None,
        categories_tags=[],
        countries_tags=[],
        last_error_code=error_code,
    )


def _as_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item.strip() for item in value if isinstance(item, str) and item.strip()]


def _pick_brand(brands: Any, brand_tags: Any) -> str | None:
    if isinstance(brands, str):
        first = brands.split(",")[0].strip()
        if first:
            return first
    if isinstance(brand_tags, list):
        for tag in brand_tags:
            if isinstance(tag, str) and tag.strip():
                return tag.strip()
    return None
