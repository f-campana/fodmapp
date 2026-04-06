from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


def _split_csv_env(raw_value: str) -> tuple[str, ...]:
    return tuple(part.strip() for part in raw_value.split(",") if part.strip())


@dataclass(frozen=True)
class Settings:
    api_db_url: str
    api_name: str
    api_version: str
    products_feature_enabled: bool
    products_stale_after_hours: int
    products_refresh_cooldown_seconds: int
    off_api_base_url: str
    off_user_agent: str
    off_timeout_seconds: float
    clerk_jwt_key: str | None
    clerk_jwt_issuer_domain: str | None
    clerk_authorized_parties: tuple[str, ...]
    api_debug_clerk_claims: bool
    api_cors_allow_origins: tuple[str, ...]
    api_allow_preview_user_id_header: bool
    node_env: str


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    user = os.getenv("USER", "postgres")
    default_db_url = f"postgresql://{user}@localhost:5432/fodmap_test"
    return Settings(
        api_db_url=os.getenv("API_DB_URL", default_db_url),
        api_name=os.getenv("API_NAME", "fodmapp-api"),
        api_version=os.getenv("API_VERSION", "v0"),
        products_feature_enabled=os.getenv("PRODUCTS_FEATURE_ENABLED", "false").strip().lower()
        in {"1", "true", "yes", "on"},
        products_stale_after_hours=int(os.getenv("PRODUCTS_STALE_AFTER_HOURS", "72")),
        products_refresh_cooldown_seconds=int(os.getenv("PRODUCTS_REFRESH_COOLDOWN_SECONDS", "900")),
        off_api_base_url=os.getenv("OFF_API_BASE_URL", "https://world.openfoodfacts.org"),
        off_user_agent=os.getenv("OFF_USER_AGENT", "FODMAPP/0.1 (contact@fodmapp.local)"),
        off_timeout_seconds=float(os.getenv("OFF_TIMEOUT_SECONDS", "3")),
        clerk_jwt_key=os.getenv("CLERK_JWT_KEY"),
        clerk_jwt_issuer_domain=os.getenv("CLERK_JWT_ISSUER_DOMAIN"),
        clerk_authorized_parties=_split_csv_env(os.getenv("CLERK_AUTHORIZED_PARTIES", "")),
        api_debug_clerk_claims=os.getenv("API_DEBUG_CLERK_CLAIMS", "false").strip().lower()
        in {"1", "true", "yes", "on"},
        api_cors_allow_origins=_split_csv_env(os.getenv("API_CORS_ALLOW_ORIGINS", "")),
        api_allow_preview_user_id_header=os.getenv("API_ALLOW_PREVIEW_USER_ID_HEADER", "false").strip().lower()
        in {"1", "true", "yes", "on"},
        node_env=os.getenv("NODE_ENV", "development"),
    )
