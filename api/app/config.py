from __future__ import annotations

import os
from dataclasses import dataclass


def _split_csv_env(raw_value: str) -> tuple[str, ...]:
    return tuple(part.strip() for part in raw_value.split(",") if part.strip())


@dataclass(frozen=True)
class Settings:
    api_db_url: str
    api_name: str
    api_version: str
    clerk_jwt_key: str | None
    clerk_jwt_issuer_domain: str | None
    clerk_authorized_parties: tuple[str, ...]
    api_cors_allow_origins: tuple[str, ...]
    api_allow_preview_user_id_header: bool
    node_env: str


def get_settings() -> Settings:
    user = os.getenv("USER", "postgres")
    default_db_url = f"postgresql://{user}@localhost:5432/fodmap_test"
    return Settings(
        api_db_url=os.getenv("API_DB_URL", default_db_url),
        api_name=os.getenv("API_NAME", "fodmapp-api"),
        api_version=os.getenv("API_VERSION", "v0"),
        clerk_jwt_key=os.getenv("CLERK_JWT_KEY"),
        clerk_jwt_issuer_domain=os.getenv("CLERK_JWT_ISSUER_DOMAIN"),
        clerk_authorized_parties=_split_csv_env(os.getenv("CLERK_AUTHORIZED_PARTIES", "")),
        api_cors_allow_origins=_split_csv_env(os.getenv("API_CORS_ALLOW_ORIGINS", "")),
        api_allow_preview_user_id_header=os.getenv("API_ALLOW_PREVIEW_USER_ID_HEADER", "false").strip().lower()
        in {"1", "true", "yes", "on"},
        node_env=os.getenv("NODE_ENV", "development"),
    )
