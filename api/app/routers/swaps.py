from __future__ import annotations

from fastapi import APIRouter, Query, Request

from app import sql
from app.db import Database
from app.errors import not_found
from app.models import AppliedFilters, SwapItem, SwapListResponse

router = APIRouter(prefix="/v0", tags=["swaps"])


def _get_db(request: Request) -> Database:
    return request.app.state.db


@router.get("/swaps", response_model=SwapListResponse)
def get_swaps(
    request: Request,
    from_slug: str = Query(..., alias="from"),
    limit: int = Query(10, ge=1, le=50),
    min_safety_score: float = Query(0.0, ge=0.0, le=1.0),
) -> SwapListResponse:
    db = _get_db(request)
    with db.readonly_connection() as conn:
        exists = sql.fetch_one(conn, sql.SQL_GET_FOOD_SLUG_EXISTS, {"food_slug": from_slug})
        if exists is None:
            raise not_found("Source food not found")

        rows = sql.fetch_all(
            conn,
            sql.SQL_LIST_SWAPS,
            {
                "from_slug": from_slug,
                "limit": limit,
                "min_safety_score": min_safety_score,
            },
        )

    items = [SwapItem(**row) for row in rows]
    return SwapListResponse(
        from_food_slug=from_slug,
        applied_filters=AppliedFilters(limit=limit, min_safety_score=min_safety_score),
        items=items,
        total=len(items),
    )
