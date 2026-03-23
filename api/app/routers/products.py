from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Request

from app.config import get_settings
from app.errors import not_found
from app.models import (
    ProductAssessmentResponse,
    ProductIngredientsResponse,
    ProductLookupResponse,
    ProductResponse,
)
from app.products_service import ProductsService

router = APIRouter(prefix="/v0/products", tags=["products"])


def _get_service(request: Request) -> ProductsService:
    return ProductsService(request.app.state.db, get_settings())


def _ensure_enabled() -> None:
    if not get_settings().products_feature_enabled:
        raise not_found("Resource not found")


@router.get("/barcodes/{code}", response_model=ProductLookupResponse)
def lookup_product_barcode(code: str, request: Request) -> ProductLookupResponse:
    _ensure_enabled()
    payload = _get_service(request).lookup_barcode(code)
    return ProductLookupResponse(**payload)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: UUID, request: Request) -> ProductResponse:
    _ensure_enabled()
    payload = _get_service(request).get_product(product_id)
    return ProductResponse(**payload)


@router.get("/{product_id}/ingredients", response_model=ProductIngredientsResponse)
def get_product_ingredients(product_id: UUID, request: Request) -> ProductIngredientsResponse:
    _ensure_enabled()
    payload = _get_service(request).get_product_ingredients(product_id)
    return ProductIngredientsResponse(**payload)


@router.get("/{product_id}/assessment", response_model=ProductAssessmentResponse)
def get_product_assessment(product_id: UUID, request: Request) -> ProductAssessmentResponse:
    _ensure_enabled()
    payload = _get_service(request).get_product_assessment(product_id)
    return ProductAssessmentResponse(**payload)
