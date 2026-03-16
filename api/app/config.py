from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True)
class Settings:
    api_db_url: str
    api_name: str
    api_version: str


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    user = os.getenv("USER", "postgres")
    default_db_url = f"postgresql://{user}@localhost:5432/fodmap_test"
    return Settings(
        api_db_url=os.getenv("API_DB_URL", default_db_url),
        api_name=os.getenv("API_NAME", "fodmapp-api"),
        api_version=os.getenv("API_VERSION", "v0"),
    )
