from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Request

from app.config import get_settings
from app.errors import service_unavailable
from app.models import HealthResponse

router = APIRouter(prefix="/v0", tags=["health"])


@router.get("/health", response_model=HealthResponse)
def get_health(request: Request) -> HealthResponse:
    try:
        with request.app.state.db.readonly_connection() as conn:
            conn.execute("SELECT 1")
    except Exception as exc:
        raise service_unavailable("Database unavailable") from exc

    settings = get_settings()
    return HealthResponse(
        status="ok",
        service=settings.api_name,
        version=settings.api_version,
        timestamp=datetime.now(timezone.utc),
    )
