from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    api_db_url: str
    api_name: str
    api_version: str
    clerk_jwt_key: str | None
    clerk_jwt_issuer_domain: str | None
    clerk_authorized_parties: tuple[str, ...]
    api_allow_preview_user_id_header: bool
    node_env: str


def get_settings() -> Settings:
    user = os.getenv("USER", "postgres")
    default_db_url = f"postgresql://{user}@localhost:5432/fodmap_test"
    authorized_parties_raw = os.getenv("CLERK_AUTHORIZED_PARTIES", "")
    authorized_parties = tuple(part.strip() for part in authorized_parties_raw.split(",") if part.strip())
    return Settings(
        api_db_url=os.getenv("API_DB_URL", default_db_url),
        api_name=os.getenv("API_NAME", "fodmapp-api"),
        api_version=os.getenv("API_VERSION", "v0"),
        clerk_jwt_key=os.getenv("CLERK_JWT_KEY"),
        clerk_jwt_issuer_domain=os.getenv("CLERK_JWT_ISSUER_DOMAIN"),
        clerk_authorized_parties=authorized_parties,
        api_allow_preview_user_id_header=os.getenv("API_ALLOW_PREVIEW_USER_ID_HEADER", "false").strip().lower()
        in {"1", "true", "yes", "on"},
        node_env=os.getenv("NODE_ENV", "development"),
    )
