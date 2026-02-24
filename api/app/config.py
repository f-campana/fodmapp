from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    api_db_url: str
    api_name: str
    api_version: str
    barcode_feature_enabled: bool
    barcode_internal_enabled: bool
    barcode_admin_token: str
    off_api_base_url: str
    off_user_agent: str
    off_timeout_seconds: float
    barcode_cache_ttl_hours: int
    barcode_heuristic_threshold: float
    barcode_heuristic_margin: float


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    user = os.getenv("USER", "postgres")
    default_db_url = f"postgresql://{user}@localhost:5432/fodmap_test"
    return Settings(
        api_db_url=os.getenv("API_DB_URL", default_db_url),
        api_name=os.getenv("API_NAME", "fodmap-api"),
        api_version=os.getenv("API_VERSION", "v0"),
        barcode_feature_enabled=_env_bool("BARCODE_FEATURE_ENABLED", False),
        barcode_internal_enabled=_env_bool("BARCODE_INTERNAL_ENABLED", False),
        barcode_admin_token=os.getenv("BARCODE_ADMIN_TOKEN", ""),
        off_api_base_url=os.getenv("OFF_API_BASE_URL", "https://world.openfoodfacts.org"),
        off_user_agent=os.getenv("OFF_USER_AGENT", "FODMAPPlatform/0.1 (contact@example.com)"),
        off_timeout_seconds=float(os.getenv("OFF_TIMEOUT_SECONDS", "3")),
        barcode_cache_ttl_hours=int(os.getenv("BARCODE_CACHE_TTL_HOURS", "168")),
        barcode_heuristic_threshold=float(os.getenv("BARCODE_HEURISTIC_THRESHOLD", "0.75")),
        barcode_heuristic_margin=float(os.getenv("BARCODE_HEURISTIC_MARGIN", "0.10")),
    )
