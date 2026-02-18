from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from app.config import get_settings
from app.models import HealthResponse

router = APIRouter(prefix="/v0", tags=["health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service=settings.api_name,
        version=settings.api_version,
        timestamp=datetime.now(timezone.utc),
    )
