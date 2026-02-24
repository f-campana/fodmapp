from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import get_settings
from app.db import Database
from app.errors import register_error_handlers
from app.providers.open_food_facts import OpenFoodFactsClient
from app.routers.barcodes import router as barcodes_router
from app.routers.foods import router as foods_router
from app.routers.health import router as health_router
from app.routers.internal_barcodes import router as internal_barcodes_router
from app.routers.swaps import router as swaps_router
from app.services.barcode_service import BarcodeService


def create_app() -> FastAPI:
    settings = get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        db = Database(settings.api_db_url)
        db.open()
        app.state.db = db
        app.state.barcode_service = BarcodeService(db, settings, OpenFoodFactsClient(settings))
        try:
            yield
        finally:
            db.close()

    app = FastAPI(
        title=settings.api_name,
        version=settings.api_version,
        description=(
            "Read-only v0 API for food metadata, full rollups, traits, and active swaps. "
            "Rollup freshness depends on phase3 snapshot tables rebuilt by "
            "etl/phase3/sql/phase3_rollups_compute.sql."
        ),
        lifespan=lifespan,
    )

    register_error_handlers(app)

    app.include_router(health_router)
    app.include_router(foods_router)
    app.include_router(swaps_router)
    app.include_router(barcodes_router)
    app.include_router(internal_barcodes_router)

    return app


app = create_app()
