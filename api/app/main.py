from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import Database
from app.errors import register_error_handlers
from app.routers.foods import router as foods_router
from app.routers.health import router as health_router
from app.routers.me import router as me_router
from app.routers.me_delete import router as me_delete_router
from app.routers.products import router as products_router
from app.routers.safe_harbors import router as safe_harbors_router
from app.routers.swaps import router as swaps_router
from app.routers.sync import router as sync_router
from app.routers.tracking import router as tracking_router


def create_app() -> FastAPI:
    settings = get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        db = Database(settings.api_db_url)
        db.open()
        app.state.db = db
        try:
            yield
        finally:
            db.close()

    app = FastAPI(
        title=settings.api_name,
        version=settings.api_version,
        description=(
            "Canonical v0 API for food metadata, full rollups, safe-harbors, and active swaps, "
            "plus an opt-in guided `/v0/products` discovery lane for packaged products. "
            "Canonical food rollup freshness depends on phase3 snapshot tables rebuilt by "
            "etl/phase3/sql/phase3_rollups_compute.sql."
        ),
        openapi_tags=[
            {
                "name": "health",
                "description": "Liveness and publish-metadata checks for the live API.",
            },
            {
                "name": "foods",
                "description": "Read-only food catalog lookups, rollups, subtypes, and traits.",
            },
            {
                "name": "products",
                "description": "Guided packaged-product lookup and assessment endpoints.",
            },
            {
                "name": "safe-harbors",
                "description": "Safe-Harbor V1 cohort discovery and food eligibility lists.",
            },
            {
                "name": "swaps",
                "description": "Active swap recommendations derived from the published Phase 3 views.",
            },
            {
                "name": "account",
                "description": "Consent, export, and delete controls for the signed-in user.",
            },
            {
                "name": "tracking",
                "description": "Symptoms, meals, custom foods, saved meals, and tracking summaries.",
            },
            {
                "name": "sync",
                "description": "Current mutation sync API for clients that mirror local writes.",
            },
        ],
        lifespan=lifespan,
    )

    register_error_handlers(app)

    cors_allow_origins = tuple(dict.fromkeys((*settings.clerk_authorized_parties, *settings.api_cors_allow_origins)))
    if cors_allow_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=list(cors_allow_origins),
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(health_router)
    app.include_router(foods_router)
    app.include_router(products_router)
    app.include_router(safe_harbors_router)
    app.include_router(swaps_router)
    app.include_router(me_router)
    app.include_router(me_delete_router)
    app.include_router(tracking_router)
    app.include_router(sync_router)

    return app


app = create_app()
