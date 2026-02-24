from __future__ import annotations

from fastapi import APIRouter, Request

from app.config import get_settings
from app.errors import not_found
from app.models import BarcodeLookupResponse
from app.services.barcode_service import BarcodeService

router = APIRouter(prefix="/v0", tags=["barcodes"])


def _get_service(request: Request) -> BarcodeService:
    return request.app.state.barcode_service


@router.get("/barcodes/{code}", response_model=BarcodeLookupResponse)
def get_barcode_lookup(code: str, request: Request) -> BarcodeLookupResponse:
    settings = get_settings()
    if not settings.barcode_feature_enabled:
        raise not_found("Resource not found")

    payload = _get_service(request).lookup(code)
    return BarcodeLookupResponse(**payload)
