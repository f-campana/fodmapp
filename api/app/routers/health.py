from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Request

from app import sql
from app.config import get_settings
from app.errors import service_unavailable
from app.models import HealthResponse

router = APIRouter(prefix="/v0", tags=["health"])


@router.get("/health", response_model=HealthResponse)
def get_health(request: Request) -> HealthResponse:
    publish_meta: dict | None = None

    try:
        with request.app.state.db.readonly_connection() as conn:
            conn.execute("SELECT 1")
            meta_view = sql.fetch_one(conn, sql.SQL_HAS_API_PUBLISH_META_VIEW, {})
            if meta_view and meta_view.get("relation_name"):
                publish_meta = sql.fetch_one(conn, sql.SQL_GET_API_PUBLISH_META, {})
    except Exception as exc:
        raise service_unavailable("Database unavailable") from exc

    settings = get_settings()
    return HealthResponse(
        status="ok",
        service=settings.api_name,
        version=settings.api_version,
        timestamp=datetime.now(timezone.utc),
        publish_id=publish_meta.get("publish_id") if publish_meta else None,
        published_at=publish_meta.get("published_at") if publish_meta else None,
        rollup_computed_at_max=publish_meta.get("rollup_computed_at_max") if publish_meta else None,
    )
